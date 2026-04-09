'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, Wrench, Image, MessageSquare, Settings, LogOut, ChevronLeft, FileText, Link2, Layers, Package } from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/cotizaciones', label: 'Pipeline', icon: FileText, badgeKey: 'quotes_new' },
  { href: '/admin/compartir', label: 'Generar links', icon: Link2 },
  { href: '/admin/antes-despues', label: 'Antes/Después', icon: Layers },
  { href: '/admin/servicios', label: 'Servicios', icon: Wrench },
  { href: '/admin/accesorios', label: 'Accesorios', icon: Package },
  { href: '/admin/galeria', label: 'Galería', icon: Image },
  { href: '/admin/testimonios', label: 'Testimonios', icon: MessageSquare },
  { href: '/admin/config', label: 'Configuración', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [newQuotes, setNewQuotes] = useState<number>(0)

  // Badge: cotizaciones en estado "new". Polling cada 60s.
  useEffect(() => {
    let alive = true
    const supabase = createClient()
    const load = async () => {
      const { count } = await supabase
        .from('quotes')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'new')
      if (alive && typeof count === 'number') setNewQuotes(count)
    }
    load()
    const t = setInterval(load, 60_000)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [pathname])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <aside className="admin-sidebar w-64 min-h-screen flex flex-col py-6 px-4 flex-shrink-0">
      {/* Logo */}
      <div className="px-3 mb-8">
        <h1 className="text-xl font-black">
          <span className="text-[#FF6B35]">TAPI</span>
          <span className="text-white">CASCOS</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1">Admin Panel</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#FF6B35]/15 text-[#FF6B35]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={18} />
              <span className="flex-1">{item.label}</span>
              {item.badgeKey === 'quotes_new' && newQuotes > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#FF6B35] text-white min-w-[20px] text-center">
                  {newQuotes}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className="space-y-1 pt-4 border-t border-white/10">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <ChevronLeft size={18} />
          Ver Sitio
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-400/5 transition-all w-full"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
