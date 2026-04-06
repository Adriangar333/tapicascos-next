'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import HeroCanvas from './HeroCanvas'

const HELMET_IMAGE = 'https://afrunlbsblvixfihdnta.supabase.co/storage/v1/object/public/images/pintura-personalizada-1.jpeg'

export default function Hero() {
  const counterRef = useRef<HTMLSpanElement>(null)
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
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

    const ctx = gsap.context(() => {
      gsap.from('.hero-badge', { y: -20, opacity: 0, duration: 0.8, ease: 'power3.out' })
      gsap.from('.hero-title-1', { y: 60, opacity: 0, duration: 1, delay: 0.15, ease: 'power4.out' })
      gsap.from('.hero-title-2', { y: 60, opacity: 0, duration: 1, delay: 0.3, ease: 'power4.out' })
      gsap.from('.hero-sub', { y: 30, opacity: 0, duration: 0.9, delay: 0.55, ease: 'power3.out' })
      gsap.from('.hero-cta', { y: 30, opacity: 0, duration: 0.8, delay: 0.75, stagger: 0.12, ease: 'power3.out' })
      gsap.from('.hero-trust', { y: 20, opacity: 0, duration: 0.8, delay: 1, stagger: 0.1, ease: 'power2.out' })

      gsap.from('.hero-frame', {
        scale: 0.85,
        opacity: 0,
        duration: 1.4,
        delay: 0.3,
        ease: 'power4.out',
      })
      gsap.from('.hero-corner', {
        opacity: 0,
        scale: 0.5,
        duration: 0.8,
        delay: 1.2,
        stagger: 0.1,
        ease: 'power3.out',
      })

      // Subtle float
      gsap.to('.hero-frame', {
        y: -12,
        duration: 4,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      })

      // Glow pulse
      gsap.to('.hero-glow', {
        opacity: 0.75,
        duration: 3,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      })

      // Scanning beam (travels top→bottom)
      gsap.fromTo(
        '.hero-scan',
        { top: '0%', opacity: 0 },
        {
          top: '100%',
          opacity: 1,
          duration: 2.8,
          ease: 'none',
          repeat: -1,
          delay: 1.2,
          repeatDelay: 0.6,
        }
      )
    }, rootRef)

    return () => {
      clearInterval(timer)
      ctx.revert()
    }
  }, [])

  const hex = 'polygon(25% 2%, 75% 2%, 98% 50%, 75% 98%, 25% 98%, 2% 50%)'

  return (
    <section ref={rootRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-16">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0E1A] via-[#0F1428] to-[#0A0E1A]" />

      {/* Industrial grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,107,53,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,107,53,0.5) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
        }}
      />

      {/* Accent glows */}
      <div className="absolute top-1/3 left-1/5 w-[420px] h-[420px] bg-[#FF6B35] opacity-[0.09] rounded-full blur-[140px]" />
      <div className="absolute bottom-1/4 right-1/5 w-[360px] h-[360px] bg-[#FFD700] opacity-[0.04] rounded-full blur-[120px]" />

      {/* Three.js subtle particles */}
      <HeroCanvas />

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        {/* Left: Text */}
        <div className="text-center lg:text-left order-2 lg:order-1">
          <div className="hero-badge inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm text-gray-300 uppercase tracking-[0.2em]">Barranquilla · CO</span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[0.95] mb-6 tracking-tight">
            <span className="hero-title-1 block text-white">TU CASCO,</span>
            <span className="hero-title-2 block gradient-text">TU ESTILO</span>
          </h1>

          <p className="hero-sub text-base md:text-lg text-gray-300 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
            Tapizado premium, pintura personalizada y accesorios para que tu casco
            refleje quién eres. Más de <span ref={counterRef} className="text-[#FF6B35] font-bold">+5,000</span> cascos transformados.
          </p>

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

          <div className="flex flex-wrap justify-center lg:justify-start gap-6 md:gap-10">
            <div className="hero-trust">
              <p className="text-2xl md:text-3xl font-bold text-[#FF6B35]">+10</p>
              <p className="text-xs md:text-sm text-gray-500 uppercase tracking-wider">Años</p>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="hero-trust">
              <p className="text-2xl md:text-3xl font-bold text-[#FFD700]">5,000+</p>
              <p className="text-xs md:text-sm text-gray-500 uppercase tracking-wider">Cascos</p>
            </div>
            <div className="w-px h-12 bg-white/10 hidden sm:block" />
            <div className="hero-trust">
              <p className="text-2xl md:text-3xl font-bold text-white">100%</p>
              <p className="text-xs md:text-sm text-gray-500 uppercase tracking-wider">Garantía</p>
            </div>
          </div>
        </div>

        {/* Right: Helmet showcase — hexagonal industrial frame */}
        <div className="order-1 lg:order-2 relative flex items-center justify-center">
          <div className="relative w-[340px] h-[380px] md:w-[460px] md:h-[510px] lg:w-[520px] lg:h-[580px]">
            {/* Glow behind */}
            <div
              className="hero-glow absolute inset-0 blur-[90px] opacity-50"
              style={{
                background: 'radial-gradient(ellipse at center, #FF6B35 0%, #FFD700 35%, transparent 70%)',
              }}
            />

            {/* Outer hex border accent */}
            <div
              className="absolute inset-0"
              style={{
                clipPath: hex,
                background: 'linear-gradient(135deg, #FF6B35 0%, transparent 40%, transparent 60%, #FFD700 100%)',
                padding: '2px',
              }}
            >
              <div className="w-full h-full bg-[#0A0E1A]" style={{ clipPath: hex }} />
            </div>

            {/* Hex image frame */}
            <div className="hero-frame absolute inset-[6px]" style={{ clipPath: hex }}>
              <div className="relative w-full h-full">
                <Image
                  src={HELMET_IMAGE}
                  alt="Casco personalizado premium Tapicascos"
                  fill
                  priority
                  sizes="(max-width: 768px) 340px, (max-width: 1024px) 460px, 520px"
                  className="object-cover"
                  style={{ filter: 'contrast(1.1) saturate(1.1)' }}
                />
                {/* Dark vignette for depth */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(ellipse at center, transparent 40%, rgba(10,14,26,0.75) 100%)',
                  }}
                />
                {/* Scanline effect */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-[0.08] mix-blend-overlay"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0px, rgba(255,255,255,0.6) 1px, transparent 1px, transparent 3px)',
                  }}
                />
                {/* Top shine */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />

                {/* Scanning beam */}
                <div
                  className="hero-scan absolute left-0 right-0 h-[3px] pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent, #FF6B35 30%, #FFD700 50%, #FF6B35 70%, transparent)',
                    boxShadow: '0 0 20px #FF6B35, 0 0 40px #FF6B35',
                  }}
                />
              </div>
            </div>

            {/* Corner brackets — industrial targeting feel */}
            <div className="hero-corner absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6 border-t-2 border-[#FF6B35]" />
            <div className="hero-corner absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-6 border-b-2 border-[#FF6B35]" />
            <div className="hero-corner absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 border-l-2 border-[#FF6B35]" />
            <div className="hero-corner absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 border-r-2 border-[#FF6B35]" />

            {/* Tech label bottom-right */}
            <div className="hero-corner absolute -bottom-2 right-6 md:right-10 flex items-center gap-2 px-3 py-1.5 bg-[#0A0E1A] border border-[#FF6B35]/40 text-[10px] md:text-xs font-mono tracking-[0.2em] text-[#FF6B35] uppercase">
              <span className="w-1.5 h-1.5 bg-[#FF6B35] animate-pulse" />
              Premium · 001
            </div>
            {/* Tech label top-left */}
            <div className="hero-corner absolute -top-2 left-6 md:left-10 px-3 py-1.5 bg-[#0A0E1A] border border-white/20 text-[10px] md:text-xs font-mono tracking-[0.25em] text-white/70 uppercase">
              Tapicascos / BAQ
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
