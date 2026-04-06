'use client'

import { useEffect, useRef } from 'react'

export default function Hero() {
  const counterRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    // Animated counter
    const target = 5000
    let current = 0
    const increment = target / 80
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        current = target
        clearInterval(timer)
      }
      if (counterRef.current) {
        counterRef.current.textContent = `+${Math.floor(current).toLocaleString()}`
      }
    }, 25)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0E1A] via-[#0F1428] to-[#0A0E1A]" />

      {/* Subtle orb effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FF6B35] opacity-[0.04] rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#FFD700] opacity-[0.03] rounded-full blur-[100px]" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-gray-300">Barranquilla, Colombia</span>
        </div>

        {/* Main headline */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.95] mb-6">
          <span className="block text-white">TU CASCO,</span>
          <span className="block gradient-text">TU ESTILO</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Tapizado premium, pintura personalizada y accesorios para que tu casco
          refleje quién eres. Más de <span ref={counterRef} className="text-[#FF6B35] font-bold">+5,000</span> cascos transformados.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <a href="/cotizar" className="btn-primary text-lg px-8 py-4">
            Cotizar mi casco
          </a>
          <a
            href="#servicios"
            className="px-8 py-4 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/5 transition-all text-lg text-center"
          >
            Ver Servicios y Precios
          </a>
        </div>

        {/* Trust indicators */}
        <div className="flex flex-wrap justify-center gap-8 md:gap-12 text-center">
          <div>
            <p className="text-2xl md:text-3xl font-bold text-[#FF6B35]">+10</p>
            <p className="text-sm text-gray-500">Años de experiencia</p>
          </div>
          <div className="w-px h-12 bg-white/10 hidden md:block" />
          <div>
            <p className="text-2xl md:text-3xl font-bold text-[#FFD700]">5,000+</p>
            <p className="text-sm text-gray-500">Cascos transformados</p>
          </div>
          <div className="w-px h-12 bg-white/10 hidden md:block" />
          <div>
            <p className="text-2xl md:text-3xl font-bold text-white">100%</p>
            <p className="text-sm text-gray-500">Satisfacción garantizada</p>
          </div>
        </div>
      </div>

    </section>
  )
}
