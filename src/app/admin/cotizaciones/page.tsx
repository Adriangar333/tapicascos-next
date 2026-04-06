import { createClient } from '@/lib/supabase/server'

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

export default async function CotizacionesPage() {
  const supabase = await createClient()
  const { data: quotes } = await supabase
    .from('quotes')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <h1 className="text-3xl font-black mb-2">Cotizaciones</h1>
      <p className="text-gray-400 mb-8">Solicitudes enviadas desde el formulario público.</p>

      {!quotes || quotes.length === 0 ? (
        <div className="p-8 rounded-xl border border-white/10 bg-white/5 text-gray-400">
          Aún no hay cotizaciones.
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.map((q) => {
            const waMsg = encodeURIComponent(
              `Hola ${q.name}, te contactamos de Tapicascos por tu solicitud de ${serviceLabels[q.service_type] ?? q.service_type}.`
            )
            const waPhone = q.phone.replace(/\D/g, '')
            const waLink = `https://wa.me/57${waPhone.startsWith('57') ? waPhone.slice(2) : waPhone}?text=${waMsg}`
            return (
              <div key={q.id} className="p-5 rounded-xl border border-white/10 bg-white/5">
                <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                  <div>
                    <h3 className="text-lg font-bold">{q.name}</h3>
                    <p className="text-sm text-gray-400">
                      {q.phone}{q.email ? ` · ${q.email}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="px-3 py-1 text-xs rounded-full bg-[#FF6B35]/20 text-[#FF6B35]">
                      {serviceLabels[q.service_type] ?? q.service_type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(q.created_at).toLocaleDateString('es-CO', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
                {(q.helmet_brand || q.helmet_model) && (
                  <p className="text-sm text-gray-300 mb-2">
                    <strong>Casco:</strong> {[q.helmet_brand, q.helmet_model].filter(Boolean).join(' ')}
                  </p>
                )}
                {q.color_preference && (
                  <p className="text-sm text-gray-300 mb-2">
                    <strong>Estilo:</strong> {q.color_preference}
                  </p>
                )}
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{q.description}</p>
                {q.budget_range && (
                  <p className="text-sm text-gray-500 mt-2">
                    Presupuesto: {q.budget_range}
                  </p>
                )}
                <div className="mt-4">
                  <a
                    href={waLink}
                    target="_blank"
                    className="inline-block btn-primary text-sm px-4 py-2"
                  >
                    Responder por WhatsApp
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
