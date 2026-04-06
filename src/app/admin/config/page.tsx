'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SiteConfig } from '@/lib/types'
import { Save, Check } from 'lucide-react'

const defaultConfigs = [
  { key: 'hero_title', value: 'TU CASCO, TU ESTILO', description: 'Título principal del hero' },
  { key: 'hero_subtitle', value: 'Tapizado premium, pintura personalizada y accesorios para que tu casco refleje quién eres.', description: 'Subtítulo del hero' },
  { key: 'whatsapp_number', value: '573001234567', description: 'Número de WhatsApp (con código de país)' },
  { key: 'instagram_url', value: 'https://www.instagram.com/tapicascos_baq', description: 'URL de Instagram' },
  { key: 'address', value: 'Cra 45 # 82-30, Barranquilla', description: 'Dirección física' },
  { key: 'schedule', value: 'Lunes a Viernes: 8am — 6pm | Sábados: 8am — 2pm', description: 'Horario de atención' },
  { key: 'cascos_counter', value: '5000', description: 'Número de cascos transformados (hero)' },
  { key: 'years_experience', value: '10', description: 'Años de experiencia' },
]

export default function ConfigAdmin() {
  const [configs, setConfigs] = useState<SiteConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState<string | null>(null)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const { data } = await supabase.from('site_config').select('*').order('key')
    if (data) setConfigs(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSave = async (key: string, value: string) => {
    const existing = configs.find(c => c.key === key)
    if (existing) {
      await supabase.from('site_config').update({ value }).eq('id', existing.id)
    } else {
      const def = defaultConfigs.find(d => d.key === key)
      await supabase.from('site_config').insert({ key, value, description: def?.description || '' })
    }
    setSaved(key)
    setTimeout(() => setSaved(null), 2000)
    fetchData()
  }

  const initDefaults = async () => {
    for (const cfg of defaultConfigs) {
      const exists = configs.find(c => c.key === cfg.key)
      if (!exists) {
        await supabase.from('site_config').insert(cfg)
      }
    }
    fetchData()
  }

  if (loading) return <div className="text-gray-400">Cargando configuración...</div>

  // Merge defaults with existing
  const merged = defaultConfigs.map(def => {
    const existing = configs.find(c => c.key === def.key)
    return existing || { ...def, id: '' }
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Configuración del Sitio</h1>
          <p className="text-gray-400 text-sm">Ajusta textos, contacto y datos generales</p>
        </div>
        {configs.length === 0 && (
          <button onClick={initDefaults} className="btn-primary text-sm">
            Cargar valores por defecto
          </button>
        )}
      </div>

      <div className="space-y-4">
        {merged.map(cfg => (
          <ConfigRow
            key={cfg.key}
            configKey={cfg.key}
            value={(cfg as SiteConfig).value || (cfg as typeof defaultConfigs[0]).value}
            description={cfg.description || ''}
            saved={saved === cfg.key}
            onSave={handleSave}
          />
        ))}
      </div>
    </div>
  )
}

function ConfigRow({ configKey, value, description, saved, onSave }: {
  configKey: string; value: string; description: string; saved: boolean;
  onSave: (key: string, value: string) => void
}) {
  const [val, setVal] = useState(value)
  const isLong = val.length > 80 || configKey.includes('subtitle')

  return (
    <div className="admin-card">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <p className="text-sm font-medium text-white">{configKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <button
          onClick={() => onSave(configKey, val)}
          disabled={val === value}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
            saved
              ? 'bg-green-400/20 text-green-400'
              : val !== value
                ? 'bg-[#FF6B35]/20 text-[#FF6B35] hover:bg-[#FF6B35]/30'
                : 'text-gray-600 cursor-not-allowed'
          }`}
        >
          {saved ? <><Check size={14} /> Guardado</> : <><Save size={14} /> Guardar</>}
        </button>
      </div>
      {isLong ? (
        <textarea
          className="input-field min-h-[60px]"
          value={val}
          onChange={e => setVal(e.target.value)}
        />
      ) : (
        <input
          className="input-field"
          value={val}
          onChange={e => setVal(e.target.value)}
        />
      )}
    </div>
  )
}
