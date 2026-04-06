'use client'

import { useEffect, useRef } from 'react'
import type { Testimonial } from '@/lib/types'

const fallbackTestimonials: Testimonial[] = [
  { id: '1', name: 'Carlos M.', text: 'Excelente trabajo de tapizado. Mi casco quedó como nuevo, incluso mejor. Muy profesional y rápido.', rating: 5, active: true },
  { id: '2', name: 'Andrea L.', text: 'La pintura personalizada quedó increíble. Todos me preguntan dónde lo hice. 100% recomendado.', rating: 5, active: true },
  { id: '3', name: 'Miguel R.', text: 'Llevé mi silla de moto que estaba destruida y quedó perfecta. Buen precio y buen servicio.', rating: 5, active: true },
]

interface TestimonialsProps {
  testimonials?: Testimonial[]
}

export default function Testimonials({ testimonials }: TestimonialsProps) {
  const items = testimonials?.length ? testimonials : fallbackTestimonials
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add('visible') },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="section-fade py-24 px-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#FF6B35] opacity-[0.03] rounded-full blur-[120px]" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <div className="moto-stripe mx-auto mb-4" />
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            Lo que dicen <span className="gradient-text">nuestros clientes</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {items.filter(t => t.active).map((t) => (
            <div key={t.id} className="glass p-6 flex flex-col">
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill="#FFD700">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <p className="text-gray-300 leading-relaxed flex-1 text-sm md:text-base">
                &ldquo;{t.text}&rdquo;
              </p>

              {/* Author */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="font-semibold text-white">{t.name}</p>
                <p className="text-xs text-gray-500">Cliente verificado</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
