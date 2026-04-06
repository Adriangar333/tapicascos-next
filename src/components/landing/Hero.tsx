'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import HeroCanvas from './HeroCanvas'

export default function Hero() {
  const counterRef = useRef<HTMLSpanElement>(null)
  const rootRef = useRef<HTMLElement>(null)

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

    // GSAP entrance
    const ctx = gsap.context(() => {
      gsap.from('.hero-badge', { y: -20, opacity: 0, duration: 0.8, ease: 'power3.out' })
      gsap.from('.hero-title-1', { y: 60, opacity: 0, duration: 1, delay: 0.15, ease: 'power4.out' })
      gsap.from('.hero-title-2', { y: 60, opacity: 0, duration: 1, delay: 0.3, ease: 'power4.out' })
      gsap.from('.hero-sub', { y: 30, opacity: 0, duration: 0.9, delay: 0.55, ease: 'power3.out' })
      gsap.from('.hero-cta', { y: 30, opacity: 0, duration: 0.8, delay: 0.75, stagger: 0.12, ease: 'power3.out' })
      gsap.from('.hero-trust', { y: 20, opacity: 0, duration: 0.8, delay: 1, stagger: 0.1, ease: 'power2.out' })
    }, rootRef)

    return () => {
      clearInterval(timer)
      ctx.revert()
    }
  }, [])

  return (
    <section ref={rootRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0E1A] via-[#0F1428] to-[#0A0E1A]" />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#FF6B35] opacity-[0.08] rounded-full blur-[140px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[420px] h-[420px] bg-[#FFD700] opacity-[0.05] rounded-full blur-[120px]" />

      {/* Three.js canvas (casco 3D + partículas) */}
      <HeroCanvas />

      {/* Vignette para legibilidad del texto */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(10,14,26,0.65)_70%,rgba(10,14,26,0.9)_100%)] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <div className="hero-badge inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-gray-300">Barranquilla, Colombia</span>
        </div>

        {/* Main headline */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.95] mb-6 drop-shadow-[0_4px_30px_rgba(0,0,0,0.6)]">
          <span className="hero-title-1 block text-white">TU CASCO,</span>
          <span className="hero-title-2 block gradient-text">TU ESTILO</span>
        </h1>

        {/* Subtitle */}
        <p className="hero-sub text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          Tapizado premium, pintura personalizada y accesorios para que tu casco
          refleje quién eres. Más de <span ref={counterRef} className="text-[#FF6B35] font-bold">+5,000</span> cascos transformados.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <a href="/cotizar" className="hero-cta btn-primary text-lg px-8 py-4">
            Cotizar mi casco
          </a>
          <a
            href="#servicios"
            className="hero-cta px-8 py-4 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/5 backdrop-blur-sm transition-all text-lg text-center"
          >
            Ver Servicios y Precios
          </a>
        </div>

        {/* Trust indicators */}
        <div className="flex flex-wrap justify-center gap-8 md:gap-12 text-center">
          <div className="hero-trust">
            <p className="text-2xl md:text-3xl font-bold text-[#FF6B35]">+10</p>
            <p className="text-sm text-gray-500">Años de experiencia</p>
          </div>
          <div className="w-px h-12 bg-white/10 hidden md:block" />
          <div className="hero-trust">
            <p className="text-2xl md:text-3xl font-bold text-[#FFD700]">5,000+</p>
            <p className="text-sm text-gray-500">Cascos transformados</p>
          </div>
          <div className="w-px h-12 bg-white/10 hidden md:block" />
          <div className="hero-trust">
            <p className="text-2xl md:text-3xl font-bold text-white">100%</p>
            <p className="text-sm text-gray-500">Satisfacción garantizada</p>
          </div>
        </div>
      </div>

    </section>
  )
}
