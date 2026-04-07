'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

const links = [
  { href: '#servicios', label: 'Servicios' },
  { href: '#galeria', label: 'Galería' },
  { href: '#contacto', label: 'Contacto' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
      scrolled ? 'bg-[#0A0E1A]/90 backdrop-blur-lg shadow-lg shadow-black/20' : 'bg-transparent'
    }`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-3" aria-label="Tapicascos Barranquilla">
          <Image
            src="/logo-tapicascos.webp"
            alt="Tapicascos Barranquilla"
            width={44}
            height={44}
            priority
            className="h-10 w-10 md:h-11 md:w-11 drop-shadow-[0_0_12px_rgba(255,107,53,0.35)]"
          />
          <span className="text-lg md:text-xl font-black leading-none">
            <span className="text-[#FF6B35]">TAPI</span>
            <span className="text-white">CASCOS</span>
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <a key={l.href} href={l.href} className="text-sm text-gray-300 hover:text-white transition-colors">
              {l.label}
            </a>
          ))}
          <a
            href="https://wa.me/573001234567"
            target="_blank"
            className="btn-primary text-sm px-5 py-2"
          >
            Cotizar
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M3 12h18M3 6h18M3 18h18" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#0A0E1A]/95 backdrop-blur-lg border-t border-white/10">
          <div className="px-6 py-4 space-y-3">
            {links.map(l => (
              <a
                key={l.href}
                href={l.href}
                className="block text-gray-300 hover:text-white py-2"
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
              </a>
            ))}
            <a
              href="https://wa.me/573001234567"
              target="_blank"
              className="btn-primary block text-center mt-3"
            >
              Cotizar por WhatsApp
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}
