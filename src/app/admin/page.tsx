import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Wrench, Image, MessageSquare, FileText, TrendingUp, CheckCircle, XCircle } from 'lucide-react'
import AnalyticsCharts from '@/components/admin/AnalyticsCharts'

export const dynamic = 'force-dynamic'

const serviceLabels: Record<string, string> = {
  tapizado_integral: 'Tapizado integral',
  tapizado_parcial: 'Tapizado parcial',
  pintura_personalizada: 'Pintura',
  ajuste_talla: 'Ajuste talla',
  silla_moto: 'Silla moto',
  accesorios: 'Accesorios',
  otro: 'Otro',
}

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [svcRes, galRes, testRes, quotesRes] = await Promise.all([
    supabase.from('services').select('id', { count: 'exact', head: true }),
    supabase.from('gallery').select('id', { count: 'exact', head: true }),
    supabase.from('testimonials').select('id', { count: 'exact', head: true }),
    supabase.from('quotes').select('*').order('created_at', { ascending: false }),
  ])

  const quotes = quotesRes.data ?? []
  const total = quotes.length
  const won = quotes.filter((q) => q.status === 'won').length
  const lost = quotes.filter((q) => q.status === 'lost').length
  const open = quotes.filter((q) => ['new', 'contacted', 'quoted'].includes(q.status)).length
  const conversion = total > 0 ? Math.round((won / total) * 100) : 0

  // This week
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const thisWeek = quotes.filter((q) => new Date(q.created_at) >= weekAgo).length

  // Group by source
  const sourceMap = new Map<string, number>()
  for (const q of quotes) {
    const key = q.source || 'directo'
    sourceMap.set(key, (sourceMap.get(key) ?? 0) + 1)
  }
  const bySource = Array.from(sourceMap.entries()).map(([name, value]) => ({ name, value }))

  // Group by service
  const svcMap = new Map<string, number>()
  for (const q of quotes) {
    const key = serviceLabels[q.service_type] ?? q.service_type
    svcMap.set(key, (svcMap.get(key) ?? 0) + 1)
  }
  const byService = Array.from(svcMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // By day (last 30)
  const days: { date: string; total: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
    const total = quotes.filter((q) => q.created_at.slice(0, 10) === key).length
    days.push({ date: label, total })
  }

  const metricCards = [
    { label: 'Cotizaciones totales', value: total, icon: FileText, color: '#FF6B35' },
    { label: 'Esta semana', value: thisWeek, icon: TrendingUp, color: '#FFD700' },
    { label: 'Activas', value: open, icon: FileText, color: '#60A5FA' },
    { label: 'Conversión', value: `${conversion}%`, icon: CheckCircle, color: '#4ADE80' },
  ]

  return (
    <div className="p-6">
      <h1 className="text-3xl font-black mb-1">Dashboard</h1>
      <p className="text-gray-400 mb-8">Métricas de tu negocio en tiempo real.</p>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metricCards.map((m) => {
          const Icon = m.icon
          return (
            <div key={m.label} className="p-5 rounded-2xl border border-white/10 bg-white/5">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs uppercase tracking-wide text-gray-400">{m.label}</p>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: m.color + '20' }}>
                  <Icon size={16} style={{ color: m.color }} />
                </div>
              </div>
              <p className="text-3xl font-black" style={{ color: m.color }}>{m.value}</p>
            </div>
          )
        })}
      </div>

      {/* Pipeline summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-8">
        {[
          { k: 'new', label: 'Nuevas', color: 'text-blue-300' },
          { k: 'contacted', label: 'Contactadas', color: 'text-yellow-300' },
          { k: 'quoted', label: 'Cotizadas', color: 'text-purple-300' },
          { k: 'won', label: 'Ganadas', color: 'text-green-300' },
          { k: 'lost', label: 'Perdidas', color: 'text-red-300' },
        ].map((s) => {
          const count = quotes.filter((q) => q.status === s.k).length
          return (
            <Link href="/admin/cotizaciones" key={s.k} className="p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all">
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{count}</p>
            </Link>
          )
        })}
      </div>

      {/* Charts */}
      <AnalyticsCharts bySource={bySource} byService={byService} byDay={days} />

      {/* Content stats */}
      <div className="mt-8 grid sm:grid-cols-3 gap-4">
        <Link href="/admin/servicios" className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all flex items-center gap-3">
          <Wrench className="text-[#FF6B35]" size={20} />
          <div>
            <p className="text-xl font-bold">{svcRes.count ?? 0}</p>
            <p className="text-xs text-gray-400">Servicios</p>
          </div>
        </Link>
        <Link href="/admin/galeria" className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all flex items-center gap-3">
          <Image className="text-[#FFD700]" size={20} />
          <div>
            <p className="text-xl font-bold">{galRes.count ?? 0}</p>
            <p className="text-xs text-gray-400">Fotos en galería</p>
          </div>
        </Link>
        <Link href="/admin/testimonios" className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all flex items-center gap-3">
          <MessageSquare className="text-[#4ADE80]" size={20} />
          <div>
            <p className="text-xl font-bold">{testRes.count ?? 0}</p>
            <p className="text-xs text-gray-400">Testimonios</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
