import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="border-t border-white/10 pt-14 pb-10 px-6 relative overflow-hidden">
      {/* Glow sutil de fondo */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(255,107,53,0.18), transparent 60%)',
        }}
      />

      <div className="max-w-6xl mx-auto relative">
        {/* Badge grande */}
        <div className="flex flex-col items-center text-center mb-10">
          <Image
            src="/logo-tapicascos.webp"
            alt="Tapicascos Barranquilla"
            width={160}
            height={160}
            className="h-20 w-20 md:h-24 md:w-24 mb-4 drop-shadow-[0_0_24px_rgba(255,107,53,0.35)]"
          />
          <p className="text-xs tracking-[0.35em] text-[#FF6B35] font-bold uppercase">
            Good Travel · Barranquilla
          </p>
          <p className="text-gray-400 text-sm mt-2 max-w-md">
            Personalización premium de cascos. Tapizado, pintura y ajuste a tu medida.
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>
            &copy; {new Date().getFullYear()}{' '}
            <span className="text-[#FF6B35] font-bold">Tapicascos</span> Barranquilla.
            Todos los derechos reservados.
          </p>
          <div className="flex gap-6">
            <a
              href="https://www.instagram.com/tapicascos_baq"
              target="_blank"
              className="hover:text-white transition-colors"
            >
              Instagram
            </a>
            <a
              href="https://wa.me/573001234567"
              target="_blank"
              className="hover:text-white transition-colors"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
