'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Wrench, Image, MessageSquare, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface Stats {
  services: number
  gallery: number
  testimonials: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ services: 0, gallery: 0, testimonials: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient()
      const [svcRes, galRes, testRes] = await Promise.all([
        supabase.from('services').select('id', { count: 'exact', head: true }),
        supabase.from('gallery').select('id', { count: 'exact', head: true }),
        supabase.from('testimonials').select('id', { count: 'exact', head: true }),
      ])
      setStats({
        services: svcRes.count || 0,
        gallery: galRes.count || 0,
        testimonials: testRes.count || 0,
      })
      setLoading(false)
    }
    fetchStats()
  }, [])

  const cards = [
    { label: 'Servicios', value: stats.services, icon: Wrench, href: '/admin/servicios', color: '#FF6B35' },
    { label: 'Galería', value: stats.gallery, icon: Image, href: '/admin/galeria', color: '#FFD700' },
    { label: 'Testimonios', value: stats.testimonials, icon: MessageSquare, href: '/admin/testimonios', color: '#4ADE80' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p className="text-gray-400 mb-8">Bienvenido al panel de administración de Tapicascos</p>

      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        {cards.map(card => {
          const Icon = card.icon
          return (
            <Link key={card.label} href={card.href} className="admin-card flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: card.color + '20' }}>
                <Icon size={22} style={{ color: card.color }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {loading ? '...' : card.value}
                </p>
                <p className="text-sm text-gray-400">{card.label}</p>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="admin-card">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={20} className="text-[#FF6B35]" />
          <h2 className="text-lg font-bold">Acciones rápidas</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Link href="/admin/servicios" className="px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm text-gray-300">
            Agregar nuevo servicio &rarr;
          </Link>
          <Link href="/admin/galeria" className="px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm text-gray-300">
            Subir foto a galería &rarr;
          </Link>
          <Link href="/admin/testimonios" className="px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm text-gray-300">
            Agregar testimonio &rarr;
          </Link>
          <Link href="/admin/config" className="px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm text-gray-300">
            Editar configuración &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}
