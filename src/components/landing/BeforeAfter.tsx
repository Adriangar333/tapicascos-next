'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

export interface BeforeAfterItem {
  id: string
  title: string
  description: string | null
  before_url: string
  after_url: string
}

interface Props {
  items?: BeforeAfterItem[]
}

export default function BeforeAfter({ items }: Props) {
  const [activeIdx, setActiveIdx] = useState(0)
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

  if (!items || items.length === 0) return null

  const current = items[activeIdx]

  return (
    <section id="antes-despues" ref={sectionRef} className="section-fade py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="moto-stripe mx-auto mb-4" />
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            Antes y <span className="gradient-text">Después</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Desliza la barra para ver la transformación real de cada casco
          </p>
        </div>

        <Slider key={current.id} before={current.before_url} after={current.after_url} alt={current.title} />

        <div className="text-center mt-6">
          <h3 className="text-xl font-bold text-white">{current.title}</h3>
          {current.description && <p className="text-gray-400 mt-1">{current.description}</p>}
        </div>

        {items.length > 1 && (
          <div className="flex justify-center gap-2 mt-8 flex-wrap">
            {items.map((it, i) => (
              <button
                key={it.id}
                onClick={() => setActiveIdx(i)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  i === activeIdx
                    ? 'bg-[#FF6B35] text-white'
                    : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                {it.title}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function Slider({ before, after, alt }: { before: string; after: string; alt: string }) {
  const [pos, setPos] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  useEffect(() => {
    const onMove = (clientX: number) => {
      if (!dragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const p = ((clientX - rect.left) / rect.width) * 100
      setPos(Math.max(0, Math.min(100, p)))
    }
    const onMouseMove = (e: MouseEvent) => onMove(e.clientX)
    const onTouchMove = (e: TouchEvent) => onMove(e.touches[0].clientX)
    const stop = () => (dragging.current = false)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('touchmove', onTouchMove)
    window.addEventListener('mouseup', stop)
    window.addEventListener('touchend', stop)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('mouseup', stop)
      window.removeEventListener('touchend', stop)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] md:aspect-[16/10] rounded-2xl overflow-hidden select-none cursor-ew-resize border border-white/10"
      onMouseDown={() => (dragging.current = true)}
      onTouchStart={() => (dragging.current = true)}
    >
      {/* After (full) */}
      <Image src={after} alt={`${alt} después`} fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 1000px" />
      <div className="absolute top-3 right-3 bg-[#FF6B35] text-white text-xs font-bold px-3 py-1 rounded-full z-20">
        DESPUÉS
      </div>

      {/* Before (clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        <Image src={before} alt={`${alt} antes`} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 1000px" />
        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full">
          ANTES
        </div>
      </div>

      {/* Handle */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white z-10 pointer-events-none"
        style={{ left: `${pos}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-2xl flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="3">
            <path d="M9 6l-6 6 6 6M15 6l6 6-6 6" />
          </svg>
        </div>
      </div>
    </div>
  )
}
