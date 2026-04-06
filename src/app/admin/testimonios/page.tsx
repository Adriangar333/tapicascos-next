'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Testimonial } from '@/lib/types'
import { Plus, Pencil, Trash2, Save, X, Star } from 'lucide-react'

export default function TestimoniosAdmin() {
  const [items, setItems] = useState<Testimonial[]>([])
  const [editing, setEditing] = useState<Partial<Testimonial> | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const { data } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false })
    if (data) setItems(data as Testimonial[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSave = async () => {
    if (!editing) return
    setSaving(true)

    const payload = {
      name: editing.name,
      text: editing.text,
      rating: editing.rating || 5,
      active: editing.active ?? true,
    }

    if (isNew) {
      await supabase.from('testimonials').insert(payload)
    } else {
      await supabase.from('testimonials').update(payload).eq('id', editing.id)
    }

    setEditing(null)
    setIsNew(false)
    setSaving(false)
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este testimonio?')) return
    await supabase.from('testimonials').delete().eq('id', id)
    fetchData()
  }

  if (loading) return <div className="text-gray-400">Cargando testimonios...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Testimonios</h1>
          <p className="text-gray-400 text-sm">Gestiona los testimonios de clientes</p>
        </div>
        <button
          onClick={() => { setEditing({ name: '', text: '', rating: 5, active: true }); setIsNew(true) }}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus size={16} /> Nuevo Testimonio
        </button>
      </div>

      {/* Editor */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="glass p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">{isNew ? 'Nuevo Testimonio' : 'Editar Testimonio'}</h2>
              <button onClick={() => { setEditing(null); setIsNew(false) }} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Nombre del cliente</label>
                <input
                  className="input-field"
                  value={editing.name || ''}
                  onChange={e => setEditing({ ...editing, name: e.target.value })}
                  placeholder="Carlos M."
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Testimonio</label>
                <textarea
                  className="input-field min-h-[100px]"
                  value={editing.text || ''}
                  onChange={e => setEditing({ ...editing, text: e.target.value })}
                  placeholder="Mi casco quedó increíble..."
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Calificación</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setEditing({ ...editing, rating: n })}
                      className="p-1"
                    >
                      <Star
                        size={20}
                        className={n <= (editing.rating || 5) ? 'text-[#FFD700]' : 'text-gray-600'}
                        fill={n <= (editing.rating || 5) ? '#FFD700' : 'none'}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editing.active ?? true}
                  onChange={e => setEditing({ ...editing, active: e.target.checked })}
                  className="accent-[#FF6B35]"
                />
                <span className="text-gray-300">Visible en el sitio</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={saving || !editing.name || !editing.text}
                className="btn-primary flex items-center gap-2 text-sm flex-1 justify-center disabled:opacity-50"
              >
                <Save size={16} /> {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={() => { setEditing(null); setIsNew(false) }}
                className="px-4 py-2.5 rounded-xl border border-white/20 text-gray-300 hover:text-white text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {items.map(t => (
          <div key={t.id} className={`admin-card flex items-start gap-4 ${!t.active ? 'opacity-50' : ''}`}>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-white">{t.name}</p>
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} size={12} className="text-[#FFD700]" fill="#FFD700" />
                  ))}
                </div>
              </div>
              <p className="text-gray-400 text-sm">&ldquo;{t.text}&rdquo;</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => { setEditing(t); setIsNew(false) }}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => handleDelete(t.id)}
                className="p-2 rounded-lg hover:bg-red-400/10 text-gray-400 hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            No hay testimonios aún. Agrega el primero.
          </div>
        )}
      </div>
    </div>
  )
}
