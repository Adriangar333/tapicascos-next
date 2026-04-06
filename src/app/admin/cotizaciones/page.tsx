import { createClient } from '@/lib/supabase/server'
import { updateQuoteStatus } from './actions'

export const dynamic = 'force-dynamic'

const serviceLabels: Record<string, string> = {
  tapizado_integral: 'Tapizado integral',
  tapizado_parcial: 'Tapizado parcial',
  pintura_personalizada: 'Pintura personalizada',
  ajuste_talla: 'Ajuste de talla',
  silla_moto: 'Silla de moto',
  accesorios: 'Accesorios',
  otro: 'Otro',
}

const columns = [
  { key: 'new', label: 'Nuevas', color: 'border-blue-500/40', badge: 'bg-blue-500/20 text-blue-300' },
  { key: 'contacted', label: 'Contactadas', color: 'border-yellow-500/40', badge: 'bg-yellow-500/20 text-yellow-300' },
  { key: 'quoted', label: 'Cotizadas', color: 'border-purple-500/40', badge: 'bg-purple-500/20 text-purple-300' },
  { key: 'won', label: 'Ganadas', color: 'border-green-500/40', badge: 'bg-green-500/20 text-green-300' },
  { key: 'lost', label: 'Perdidas', color: 'border-red-500/40', badge: 'bg-red-500/20 text-red-300' },
]

const nextStatus: Record<string, string> = {
  new: 'contacted',
  contacted: 'quoted',
  quoted: 'won',
  won: 'won',
  lost: 'lost',
}

export default async function CotizacionesPage() {
  const supabase = await createClient()
  const { data: quotes } = await supabase
    .from('quotes')
    .select('*')
    .order('created_at', { ascending: false })

  const byStatus: Record<string, typeof quotes> = {}
  for (const col of columns) byStatus[col.key] = []
  for (const q of quotes ?? []) {
    const key = q.status && byStatus[q.status] ? q.status : 'new'
    byStatus[key]!.push(q)
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-end mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black mb-1">Pipeline de cotizaciones</h1>
          <p className="text-gray-400 text-sm">
            Mueve cada cotización por las etapas para hacerle seguimiento.
          </p>
        </div>
        <div className="text-sm text-gray-400">
          Total: <span className="text-white font-bold">{quotes?.length ?? 0}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {columns.map((col) => {
          const items = byStatus[col.key] ?? []
          return (
            <div key={col.key} className={`rounded-2xl border-t-2 ${col.color} bg-white/[0.03] p-3`}>
              <div className="flex justify-between items-center mb-3 px-1">
                <h2 className="font-bold text-sm uppercase tracking-wide text-gray-300">
                  {col.label}
                </h2>
                <span className={`text-xs px-2 py-0.5 rounded-full ${col.badge}`}>{items.length}</span>
              </div>
              <div className="space-y-3">
                {items.map((q) => {
                  const waPhone = q.phone.replace(/\D/g, '')
                  const waLink = `https://wa.me/57${waPhone.startsWith('57') ? waPhone.slice(2) : waPhone}?text=${encodeURIComponent(`Hola ${q.name}, te escribo de Tapicascos por tu solicitud de ${serviceLabels[q.service_type] ?? q.service_type}.`)}`
                  return (
                    <div key={q.id} className="p-3 rounded-xl bg-[#0F1428] border border-white/10">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h3 className="font-bold text-sm truncate">{q.name}</h3>
                        <span className="text-[10px] text-gray-500 whitespace-nowrap">
                          {new Date(q.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mb-2">{q.phone}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF6B35]/20 text-[#FF6B35]">
                          {serviceLabels[q.service_type] ?? q.service_type}
                        </span>
                        {q.source && q.source !== 'direct' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                            {q.source}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-300 line-clamp-3 mb-3">{q.description}</p>
                      <div className="flex gap-1">
                        <a
                          href={waLink}
                          target="_blank"
                          className="flex-1 text-center text-[11px] py-1.5 rounded-lg bg-green-600 hover:bg-green-700 font-semibold"
                        >
                          WhatsApp
                        </a>
                        {col.key !== 'won' && col.key !== 'lost' && (
                          <form action={updateQuoteStatus}>
                            <input type="hidden" name="id" value={q.id} />
                            <input type="hidden" name="status" value={nextStatus[col.key]} />
                            <button className="text-[11px] px-2 py-1.5 rounded-lg border border-white/20 hover:bg-white/10">
                              → {columns.find((c) => c.key === nextStatus[col.key])?.label}
                            </button>
                          </form>
                        )}
                      </div>
                      {col.key !== 'lost' && col.key !== 'won' && (
                        <form action={updateQuoteStatus} className="mt-1">
                          <input type="hidden" name="id" value={q.id} />
                          <input type="hidden" name="status" value="lost" />
                          <button className="w-full text-[10px] py-1 text-gray-500 hover:text-red-400">
                            Marcar perdida
                          </button>
                        </form>
                      )}
                    </div>
                  )
                })}
                {items.length === 0 && (
                  <p className="text-xs text-gray-600 text-center py-4">Vacío</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
