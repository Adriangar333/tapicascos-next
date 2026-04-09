import { createClient } from '@/lib/supabase/server'
import { updateQuoteStatus } from './actions'
import ConversationModal from './ConversationModal'
import QuoteSearch from './QuoteSearch'
import NotesEditor from './NotesEditor'

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

type ColumnDef = {
  key: string
  label: string
  dot: string
  ring: string
  bg: string
  badge: string
}

const columns: ColumnDef[] = [
  { key: 'new',       label: 'Nuevas',      dot: 'bg-blue-400',   ring: 'ring-blue-500/20',   bg: 'bg-blue-500/[0.04]',   badge: 'bg-blue-500/15 text-blue-300' },
  { key: 'contacted', label: 'Contactadas', dot: 'bg-yellow-400', ring: 'ring-yellow-500/20', bg: 'bg-yellow-500/[0.04]', badge: 'bg-yellow-500/15 text-yellow-300' },
  { key: 'quoted',    label: 'Cotizadas',   dot: 'bg-purple-400', ring: 'ring-purple-500/20', bg: 'bg-purple-500/[0.04]', badge: 'bg-purple-500/15 text-purple-300' },
  { key: 'won',       label: 'Ganadas',     dot: 'bg-green-400',  ring: 'ring-green-500/20',  bg: 'bg-green-500/[0.04]',  badge: 'bg-green-500/15 text-green-300' },
  { key: 'lost',      label: 'Perdidas',    dot: 'bg-red-400',    ring: 'ring-red-500/20',    bg: 'bg-red-500/[0.04]',    badge: 'bg-red-500/15 text-red-300' },
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

  const byStatus: Record<string, NonNullable<typeof quotes>> = {}
  for (const col of columns) byStatus[col.key] = []
  for (const q of quotes ?? []) {
    const key = q.status && byStatus[q.status] ? q.status : 'new'
    byStatus[key]!.push(q)
  }

  const total = quotes?.length ?? 0
  const active = (byStatus.new?.length ?? 0) + (byStatus.contacted?.length ?? 0) + (byStatus.quoted?.length ?? 0)
  const won = byStatus.won?.length ?? 0
  const lost = byStatus.lost?.length ?? 0
  const closed = won + lost
  const winRate = closed > 0 ? Math.round((won / closed) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Pipeline de cotizaciones</h1>
          <p className="text-gray-400 text-sm mt-1">
            Arrastra cada cotización por las etapas para hacerle seguimiento.
          </p>
        </div>
        <QuoteSearch />
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total" value={total} tone="white" />
        <Stat label="Activas" value={active} tone="orange" />
        <Stat label="Ganadas" value={won} tone="green" />
        <Stat label="Conversión" value={`${winRate}%`} tone="purple" sub={`${won}/${closed || 0} cerradas`} />
      </div>

      {/* Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {columns.map((col) => {
          const items = byStatus[col.key] ?? []
          return (
            <section
              key={col.key}
              className={`rounded-2xl ${col.bg} ring-1 ${col.ring} flex flex-col min-h-[300px]`}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-4 pt-4 pb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                  <h2 className="font-bold text-[13px] uppercase tracking-wider text-gray-200">
                    {col.label}
                  </h2>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
                  {items.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 px-3 pb-3 space-y-3 overflow-y-auto max-h-[calc(100vh-340px)] min-h-[120px]">
                {items.map((q) => {
                  const waPhone = q.phone.replace(/\D/g, '')
                  const waLink = `https://wa.me/57${waPhone.startsWith('57') ? waPhone.slice(2) : waPhone}?text=${encodeURIComponent(`Hola ${q.name}, te escribo de Tapicascos por tu solicitud de ${serviceLabels[q.service_type] ?? q.service_type}.`)}`
                  const isIA = q.source === 'agente_ia'
                  return (
                    <article
                      key={q.id}
                      data-quote-card
                      data-quote-search={`${q.name} ${q.phone} ${q.description ?? ''} ${serviceLabels[q.service_type] ?? ''}`}
                      className="group rounded-xl bg-[#0F1428] ring-1 ring-white/10 hover:ring-white/20 transition-all p-4 space-y-3"
                    >
                      {/* Top: name + date */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-[15px] truncate">{q.name}</h3>
                          <p className="text-[11px] text-gray-500 mt-0.5 font-mono">{q.phone}</p>
                        </div>
                        <time className="text-[10px] text-gray-500 whitespace-nowrap flex-shrink-0">
                          {new Date(q.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                        </time>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#FF6B35]/15 text-[#FF6B35] ring-1 ring-[#FF6B35]/20">
                          {serviceLabels[q.service_type] ?? q.service_type}
                        </span>
                        {isIA && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 ring-1 ring-purple-500/20">
                            🤖 IA
                          </span>
                        )}
                        {q.source && q.source !== 'direct' && q.source !== 'agente_ia' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/20">
                            {q.source}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {q.description && (
                        <p className="text-[12px] text-gray-300 leading-relaxed line-clamp-3">
                          {q.description}
                        </p>
                      )}

                      {/* Conversation */}
                      {isIA && <ConversationModal quoteId={q.id} clientName={q.name} />}

                      {/* Notes */}
                      <details className="group/notes">
                        <summary className="text-[11px] text-gray-500 hover:text-gray-300 cursor-pointer list-none flex items-center gap-1 select-none">
                          <span className="group-open/notes:rotate-90 transition-transform">▸</span>
                          Notas internas
                        </summary>
                        <div className="mt-2">
                          <NotesEditor id={q.id} initial={q.notes ?? null} />
                        </div>
                      </details>

                      {/* Primary action: WhatsApp */}
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 w-full text-[12px] font-bold py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.693.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.88 11.88 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413"/></svg>
                        WhatsApp
                      </a>

                      {/* Secondary actions */}
                      <div className="flex items-center justify-between pt-1 border-t border-white/5">
                        {col.key !== 'won' && col.key !== 'lost' ? (
                          <form action={updateQuoteStatus}>
                            <input type="hidden" name="id" value={q.id} />
                            <input type="hidden" name="status" value={nextStatus[col.key]} />
                            <button className="text-[11px] font-semibold text-gray-300 hover:text-[#FF6B35] transition-colors flex items-center gap-1">
                              Mover a {columns.find((c) => c.key === nextStatus[col.key])?.label} →
                            </button>
                          </form>
                        ) : (
                          <span />
                        )}
                        {col.key !== 'lost' && col.key !== 'won' && (
                          <form action={updateQuoteStatus}>
                            <input type="hidden" name="id" value={q.id} />
                            <input type="hidden" name="status" value="lost" />
                            <button className="text-[10px] text-gray-600 hover:text-red-400 transition-colors">
                              Perder
                            </button>
                          </form>
                        )}
                      </div>
                    </article>
                  )
                })}
                {items.length === 0 && (
                  <div className="flex items-center justify-center h-24 rounded-lg border border-dashed border-white/5">
                    <p className="text-[11px] text-gray-600">Vacío</p>
                  </div>
                )}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function Stat({ label, value, tone, sub }: { label: string; value: number | string; tone: 'white' | 'orange' | 'green' | 'purple'; sub?: string }) {
  const tones = {
    white: 'text-white',
    orange: 'text-[#FF6B35]',
    green: 'text-green-400',
    purple: 'text-purple-400',
  }
  return (
    <div className="rounded-xl bg-white/[0.03] ring-1 ring-white/10 p-4">
      <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">{label}</p>
      <p className={`text-2xl font-black mt-1 ${tones[tone]}`}>{value}</p>
      {sub && <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>}
    </div>
  )
}
