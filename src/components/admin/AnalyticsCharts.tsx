'use client'

import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'

const COLORS = ['#FF6B35', '#FFD700', '#4ADE80', '#60A5FA', '#C084FC', '#F472B6']

interface Props {
  bySource: { name: string; value: number }[]
  byService: { name: string; value: number }[]
  byDay: { date: string; total: number }[]
}

export default function AnalyticsCharts({ bySource, byService, byDay }: Props) {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Cotizaciones por día */}
      <div className="p-5 rounded-2xl border border-white/10 bg-white/5 lg:col-span-2">
        <h3 className="font-bold mb-4">Cotizaciones por día (últimos 30)</h3>
        {byDay.length === 0 ? (
          <p className="text-sm text-gray-500">Aún no hay datos</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={byDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} />
              <YAxis stroke="#9ca3af" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#0F1428', border: '1px solid #ffffff20', borderRadius: 8 }} />
              <Line type="monotone" dataKey="total" stroke="#FF6B35" strokeWidth={2} dot={{ fill: '#FF6B35', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Por canal */}
      <div className="p-5 rounded-2xl border border-white/10 bg-white/5">
        <h3 className="font-bold mb-4">Por canal (UTM source)</h3>
        {bySource.length === 0 ? (
          <p className="text-sm text-gray-500">Aún no hay datos</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={bySource} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3}>
                {bySource.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#0F1428', border: '1px solid #ffffff20', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
        <div className="mt-3 space-y-1">
          {bySource.map((s, i) => (
            <div key={s.name} className="flex justify-between text-xs">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                {s.name}
              </span>
              <span className="text-gray-400">{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Por servicio */}
      <div className="p-5 rounded-2xl border border-white/10 bg-white/5">
        <h3 className="font-bold mb-4">Por tipo de servicio</h3>
        {byService.length === 0 ? (
          <p className="text-sm text-gray-500">Aún no hay datos</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byService} layout="vertical" margin={{ left: 30 }}>
              <XAxis type="number" stroke="#9ca3af" fontSize={11} allowDecimals={false} />
              <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={11} width={120} />
              <Tooltip contentStyle={{ background: '#0F1428', border: '1px solid #ffffff20', borderRadius: 8 }} />
              <Bar dataKey="value" fill="#FF6B35" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
