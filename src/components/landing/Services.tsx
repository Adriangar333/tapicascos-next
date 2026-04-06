'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { Service, Category } from '@/lib/types'

// Fallback data while Supabase loads
const fallbackCategories: Category[] = [
  { id: '1', name: 'Tapizado de Cascos', slug: 'tapizado', description: 'Renueva el interior de tu casco con materiales premium', icon: null, sort_order: 1, active: true },
  { id: '2', name: 'Pintura Personalizada', slug: 'pintura', description: 'Diseños únicos que te hacen destacar en la vía', icon: null, sort_order: 2, active: true },
  { id: '3', name: 'Sillas de Moto', slug: 'sillas', description: 'Tapizado profesional para la silla de tu moto', icon: null, sort_order: 3, active: true },
]

const fallbackServices: Service[] = [
  { id: '1', category_id: '1', name: 'Tapizado Integral', description: 'Cambio completo del interior: espuma, tela y acabados premium', price_min: 45000, price_max: 85000, image_url: null, sort_order: 1, active: true, featured: true },
  { id: '2', category_id: '1', name: 'Tapizado Parcial', description: 'Renovación de piezas específicas del interior', price_min: 15000, price_max: 40000, image_url: null, sort_order: 2, active: true, featured: false },
  { id: '3', category_id: '1', name: 'Ajuste de Talla', description: 'Ajustamos la espuma para que tu casco quede perfecto', price_min: 20000, price_max: 35000, image_url: null, sort_order: 3, active: true, featured: false },
  { id: '4', category_id: '2', name: 'Pintura Básica', description: 'Color sólido con acabado profesional', price_min: 50000, price_max: null, image_url: null, sort_order: 1, active: true, featured: false },
  { id: '5', category_id: '2', name: 'Pintura Premium', description: 'Diseño personalizado con aerógrafo, efectos y detalles', price_min: 100000, price_max: 150000, image_url: null, sort_order: 2, active: true, featured: true },
  { id: '6', category_id: '3', name: 'Tapizado de Silla', description: 'Tapizado completo con material resistente al agua', price_min: 35000, price_max: 80000, image_url: null, sort_order: 1, active: true, featured: true },
]

function formatPrice(min: number, max: number | null): string {
  const fmt = (n: number) => '$' + n.toLocaleString('es-CO')
  if (!max || max === min) return `Desde ${fmt(min)}`
  return `${fmt(min)} — ${fmt(max)}`
}

interface ServicesProps {
  categories?: Category[]
  services?: Service[]
}

export default function Services({ categories, services }: ServicesProps) {
  const cats = categories?.length ? categories : fallbackCategories
  const svcs = services?.length ? services : fallbackServices
  const [activeTab, setActiveTab] = useState(cats[0]?.id || '1')
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

  const filtered = svcs.filter(s => s.category_id === activeTab && s.active)
  const activeCat = cats.find(c => c.id === activeTab)

  return (
    <section id="servicios" ref={sectionRef} className="section-fade py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="moto-stripe mx-auto mb-4" />
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            Nuestros <span className="gradient-text">Servicios</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Cada servicio está diseñado para darte un resultado profesional que supere tus expectativas
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {cats.filter(c => c.active).map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === cat.id
                  ? 'bg-[#FF6B35] text-white shadow-lg shadow-[#FF6B35]/30'
                  : 'glass text-gray-300 hover:text-white hover:border-white/20'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Category description */}
        {activeCat && (
          <p className="text-center text-gray-400 mb-10 text-lg">
            {activeCat.description}
          </p>
        )}

        {/* Services list — NOT cards, but a clean product-style layout */}
        <div className="space-y-6">
          {filtered.map((service, i) => (
            <div
              key={service.id}
              className={`glass p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6 transition-all hover:border-[#FF6B35]/40 ${
                service.featured ? 'ring-1 ring-[#FF6B35]/30' : ''
              }`}
            >
              {/* Image placeholder */}
              {service.image_url ? (
                <div className="w-full md:w-48 h-36 rounded-lg overflow-hidden flex-shrink-0 image-shine">
                  <Image
                    src={service.image_url}
                    alt={service.name}
                    width={192}
                    height={144}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full md:w-48 h-36 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-600">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                    <circle cx="9" cy="9" r="1" fill="currentColor" />
                    <circle cx="15" cy="9" r="1" fill="currentColor" />
                  </svg>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-white">{service.name}</h3>
                      {service.featured && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#FF6B35]/20 text-[#FF6B35] font-medium">
                          Popular
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm md:text-base">{service.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl md:text-2xl font-bold text-[#FF6B35]">
                      {formatPrice(service.price_min, service.price_max)}
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <a
                href={`https://wa.me/573001234567?text=Hola%20quiero%20cotizar%20${encodeURIComponent(service.name)}`}
                target="_blank"
                className="btn-primary text-sm px-5 py-2.5 flex-shrink-0 whitespace-nowrap"
              >
                Cotizar
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
