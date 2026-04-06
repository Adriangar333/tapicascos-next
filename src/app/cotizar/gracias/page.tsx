import Link from 'next/link'
import AutoWhatsAppRedirect from './AutoWhatsAppRedirect'

export const metadata = { title: '¡Solicitud recibida! | Tapicascos' }

const serviceLabels: Record<string, string> = {
  tapizado_integral: 'tapizado integral',
  tapizado_parcial: 'tapizado parcial',
  pintura_personalizada: 'pintura personalizada',
  ajuste_talla: 'ajuste de talla',
  silla_moto: 'tapizado de silla',
  accesorios: 'accesorios',
  otro: 'un servicio',
}

const BUSINESS_PHONE = '573003199232'

export default async function GraciasPage({
  searchParams,
}: {
  searchParams: Promise<{ n?: string; s?: string }>
}) {
  const { n, s } = await searchParams
  const name = n ?? ''
  const serviceLabel = serviceLabels[s ?? ''] ?? 'un servicio'
  const text = `Hola, soy ${name}. Acabo de enviar una solicitud de ${serviceLabel} desde la página web. Quedo atento(a) a tu respuesta.`
  const waUrl = `https://wa.me/${BUSINESS_PHONE}?text=${encodeURIComponent(text)}`

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0A0E1A] via-[#0F1428] to-[#0A0E1A] text-white flex items-center justify-center px-6">
      <AutoWhatsAppRedirect url={waUrl} />
      <div className="max-w-lg text-center">
        <div className="text-6xl mb-6">✓</div>
        <h1 className="text-4xl font-black mb-4">
          ¡Recibimos tu <span className="gradient-text">solicitud</span>!
        </h1>
        <p className="text-gray-400 mb-6">
          Te estamos redirigiendo a WhatsApp para confirmar tu solicitud al instante.
          Si no se abre automáticamente, haz clic en el botón.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href={waUrl} target="_blank" className="btn-primary px-6 py-3">
            Abrir WhatsApp
          </a>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl border border-white/20 hover:bg-white/5 transition-all"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  )
}
