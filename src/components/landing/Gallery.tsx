'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { GalleryItem } from '@/lib/types'

const fallbackGallery: GalleryItem[] = [
  { id: '1', image_url: '/img/tapizado-premium-interior.jpg', caption: 'Tapizado premium interior', sort_order: 1, active: true },
  { id: '2', image_url: '/img/pintura-personalizada-shaft.jpg', caption: 'Pintura personalizada Shaft', sort_order: 2, active: true },
  { id: '3', image_url: '/img/casco-ich-iridium.jpg', caption: 'Casco ICH Iridium', sort_order: 3, active: true },
  { id: '4', image_url: '/img/silla-boxer-tapizada.jpg', caption: 'Silla Boxer tapizada', sort_order: 4, active: true },
]

interface GalleryProps {
  items?: GalleryItem[]
}

export default function Gallery({ items }: GalleryProps) {
  const gallery = items?.length ? items : fallbackGallery
  const [lightbox, setLightbox] = useState<string | null>(null)
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
    <>
      <section id="galeria" ref={sectionRef} className="section-fade py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="moto-stripe mx-auto mb-4" />
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              Nuestro <span className="gradient-text">Trabajo</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Cada proyecto es una pieza única. Mira lo que podemos hacer por tu casco.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {gallery.filter(g => g.active).map((item) => (
              <button
                key={item.id}
                onClick={() => setLightbox(item.image_url)}
                className="group relative aspect-square rounded-xl overflow-hidden image-shine cursor-pointer"
              >
                <Image
                  src={item.image_url}
                  alt={item.caption || 'Trabajo de Tapicascos'}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {item.caption && (
                  <p className="absolute bottom-3 left-3 right-3 text-sm text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {item.caption}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-6 right-6 text-white/70 hover:text-white text-3xl"
            onClick={() => setLightbox(null)}
          >
            ✕
          </button>
          <Image
            src={lightbox}
            alt="Vista ampliada"
            width={900}
            height={600}
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
          />
        </div>
      )}
    </>
  )
}
