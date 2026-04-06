export default function Footer() {
  return (
    <footer className="border-t border-white/10 py-10 px-6">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
        <p>
          &copy; {new Date().getFullYear()} <span className="text-[#FF6B35] font-bold">Tapicascos</span> Barranquilla. Todos los derechos reservados.
        </p>
        <div className="flex gap-6">
          <a href="https://www.instagram.com/tapicascos_baq" target="_blank" className="hover:text-white transition-colors">
            Instagram
          </a>
          <a href="https://wa.me/573001234567" target="_blank" className="hover:text-white transition-colors">
            WhatsApp
          </a>
        </div>
      </div>
    </footer>
  )
}
