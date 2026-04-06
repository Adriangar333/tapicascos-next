'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import HeroCanvas from './HeroCanvas'

const HELMET_IMAGE = 'https://afrunlbsblvixfihdnta.supabase.co/storage/v1/object/public/images/tapizado-shaft-551-tipo-original.jpeg'

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

    // GSAP entrance + float loop
    const ctx = gsap.context(() => {
      gsap.from('.hero-badge', { y: -20, opacity: 0, duration: 0.8, ease: 'power3.out' })
      gsap.from('.hero-title-1', { y: 60, opacity: 0, duration: 1, delay: 0.15, ease: 'power4.out' })
      gsap.from('.hero-title-2', { y: 60, opacity: 0, duration: 1, delay: 0.3, ease: 'power4.out' })
      gsap.from('.hero-sub', { y: 30, opacity: 0, duration: 0.9, delay: 0.55, ease: 'power3.out' })
      gsap.from('.hero-cta', { y: 30, opacity: 0, duration: 0.8, delay: 0.75, stagger: 0.12, ease: 'power3.out' })
      gsap.from('.hero-trust', { y: 20, opacity: 0, duration: 0.8, delay: 1, stagger: 0.1, ease: 'power2.out' })

      gsap.from('.hero-helmet', {
        scale: 0.6,
        opacity: 0,
        rotate: -15,
        duration: 1.4,
        delay: 0.4,
        ease: 'power4.out',
      })

      // Float loop
      gsap.to('.hero-helmet', {
        y: -25,
        duration: 3,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      })
      gsap.to('.hero-helmet', {
        rotate: 3,
        duration: 5,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      })

      // Glow pulse
      gsap.to('.hero-helmet-glow', {
        opacity: 0.9,
        scale: 1.1,
        duration: 2.5,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      })
    }, rootRef)

    return () => {
      clearInterval(timer)
      ctx.revert()
    }
  }, [])

  return (
    <section ref={rootRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-16">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0E1A] via-[#0F1428] to-[#0A0E1A]" />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#FF6B35] opacity-[0.08] rounded-full blur-[140px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[420px] h-[420px] bg-[#FFD700] opacity-[0.05] rounded-full blur-[120px]" />

      {/* Three.js particles */}
      <HeroCanvas />

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        {/* Left: Text content */}
        <div className="text-center lg:text-left order-2 lg:order-1">
          {/* Badge */}
          <div className="hero-badge inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm text-gray-300">Barranquilla, Colombia</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[0.95] mb-6">
            <span className="hero-title-1 block text-white">TU CASCO,</span>
            <span className="hero-title-2 block gradient-text">TU ESTILO</span>
          </h1>

          {/* Subtitle */}
          <p className="hero-sub text-base md:text-lg text-gray-300 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
            Tapizado premium, pintura personalizada y accesorios para que tu casco
            refleje quién eres. Más de <span ref={counterRef} className="text-[#FF6B35] font-bold">+5,000</span> cascos transformados.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10">
            <a href="/cotizar" className="hero-cta btn-primary text-lg px-8 py-4">
              Cotizar mi casco
            </a>
            <a
              href="#servicios"
              className="hero-cta px-8 py-4 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/5 backdrop-blur-sm transition-all text-lg text-center"
            >
              Ver Servicios
            </a>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-6 md:gap-10">
            <div className="hero-trust">
              <p className="text-2xl md:text-3xl font-bold text-[#FF6B35]">+10</p>
              <p className="text-xs md:text-sm text-gray-500">Años de experiencia</p>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="hero-trust">
              <p className="text-2xl md:text-3xl font-bold text-[#FFD700]">5,000+</p>
              <p className="text-xs md:text-sm text-gray-500">Cascos transformados</p>
            </div>
            <div className="w-px h-12 bg-white/10 hidden sm:block" />
            <div className="hero-trust">
              <p className="text-2xl md:text-3xl font-bold text-white">100%</p>
              <p className="text-xs md:text-sm text-gray-500">Satisfacción</p>
            </div>
          </div>
        </div>

        {/* Right: Helmet showcase */}
        <div className="order-1 lg:order-2 relative flex items-center justify-center">
          <div className="relative w-[320px] h-[320px] md:w-[450px] md:h-[450px] lg:w-[520px] lg:h-[520px]">
            {/* Glow behind helmet */}
            <div
              className="hero-helmet-glow absolute inset-0 rounded-full blur-[80px] opacity-60"
              style={{
                background: 'radial-gradient(circle, #FF6B35 0%, #FFD700 40%, transparent 70%)',
              }}
            />

            {/* Rotating ring */}
            <div className="absolute inset-0 rounded-full border-2 border-[#FF6B35]/20 animate-[spin_20s_linear_infinite]" />
            <div className="absolute inset-4 rounded-full border border-[#FFD700]/15 animate-[spin_30s_linear_infinite_reverse]" />

            {/* Helmet image */}
            <div className="hero-helmet absolute inset-0 flex items-center justify-center">
              <div className="relative w-[85%] h-[85%] rounded-full overflow-hidden shadow-[0_20px_80px_rgba(255,107,53,0.4)]">
                <Image
                  src={HELMET_IMAGE}
                  alt="Casco tapizado premium"
                  fill
                  priority
                  sizes="(max-width: 768px) 320px, (max-width: 1024px) 450px, 520px"
                  className="object-cover"
                />
                {/* Shine overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute -top-2 -right-2 md:top-4 md:right-0 px-3 py-1.5 rounded-full bg-[#FF6B35] text-white text-xs font-bold shadow-lg shadow-[#FF6B35]/50 animate-bounce">
              PREMIUM
            </div>
            <div className="absolute bottom-4 -left-2 md:bottom-8 md:left-0 px-3 py-1.5 rounded-full glass text-[#FFD700] text-xs font-bold border border-[#FFD700]/30">
              ★ Shaft 551
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
