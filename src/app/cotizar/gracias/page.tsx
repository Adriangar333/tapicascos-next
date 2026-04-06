import Link from 'next/link'

export const metadata = { title: '¡Solicitud recibida! | Tapicascos' }

export default function GraciasPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0A0E1A] via-[#0F1428] to-[#0A0E1A] text-white flex items-center justify-center px-6">
      <div className="max-w-lg text-center">
        <div className="text-6xl mb-6">✓</div>
        <h1 className="text-4xl font-black mb-4">
          ¡Recibimos tu <span className="gradient-text">solicitud</span>!
        </h1>
        <p className="text-gray-400 mb-8">
          En menos de 24 horas te contactamos por WhatsApp con una cotización personalizada.
          Si quieres adelantar el proceso, puedes escribirnos directamente.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="https://wa.me/573003199232?text=Hola%2C%20acabo%20de%20enviar%20una%20solicitud%20de%20cotizaci%C3%B3n"
            target="_blank"
            className="btn-primary px-6 py-3"
          >
            Escribir por WhatsApp
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
