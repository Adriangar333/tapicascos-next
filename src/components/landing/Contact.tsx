'use client'

import { useEffect, useRef } from 'react'

export default function Contact() {
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
    <section id="contacto" ref={sectionRef} className="section-fade py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="moto-stripe mx-auto mb-4" />
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            <span className="gradient-text">Visítanos</span>
          </h2>
        </div>

        <div className="glass p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-10">
            {/* Info */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-[#FF6B35] mb-2">Dirección</h3>
                <p className="text-gray-300">Cra 45 # 82-30, Barranquilla</p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#FF6B35] mb-2">Horario</h3>
                <p className="text-gray-300">Lunes a Viernes: 8am — 6pm</p>
                <p className="text-gray-300">Sábados: 8am — 2pm</p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#FF6B35] mb-2">Contacto</h3>
                <p className="text-gray-300">WhatsApp: 300 123 4567</p>
                <p className="text-gray-300">Instagram: @tapicascos_baq</p>
              </div>

              <a
                href="https://wa.me/573001234567"
                target="_blank"
                className="btn-primary inline-flex items-center gap-2"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.09.544 4.05 1.488 5.766L.05 23.5l5.94-1.56A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-1.94 0-3.75-.572-5.266-1.554l-.378-.224-3.916 1.028 1.046-3.822-.247-.392A9.705 9.705 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
                </svg>
                Escríbenos ahora
              </a>
            </div>

            {/* Map */}
            <div className="relative rounded-xl overflow-hidden h-72 md:h-auto min-h-[280px]">
              {/* Fallback */}
              <div className="absolute inset-0 bg-[#1A1F3A] flex flex-col items-center justify-center z-0 gap-2">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <p className="text-[#FF6B35] text-sm font-medium">Cra 45 # 82-30, Barranquilla</p>
                <a
                  href="https://maps.google.com/?q=10.9603,-74.78254"
                  target="_blank"
                  className="text-xs text-gray-400 hover:text-white underline"
                >
                  Abrir en Google Maps
                </a>
              </div>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3916.4!2d-74.78254!3d10.9603!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDU3JzM3LjEiTiA3NMKwNDYnNTcuMSJX!5e0!3m2!1ses!2sco!4v1"
                className="w-full h-full relative z-10"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
