'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { GalleryItem } from '@/lib/types'
import { Plus, Trash2, Eye, EyeOff, GripVertical } from 'lucide-react'

export default function GaleriaAdmin() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const { data } = await supabase.from('gallery').select('*').order('sort_order')
    if (data) setItems(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()
      const path = `gallery/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error } = await supabase.storage.from('images').upload(path, file)
      if (error) { console.error(error); continue }

      const { data: urlData } = supabase.storage.from('images').getPublicUrl(path)

      await supabase.from('gallery').insert({
        image_url: urlData.publicUrl,
        caption: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        sort_order: items.length + 1,
        active: true,
      })
    }

    setUploading(false)
    fetchData()
    e.target.value = ''
  }

  const toggleActive = async (item: GalleryItem) => {
    await supabase.from('gallery').update({ active: !item.active }).eq('id', item.id)
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta imagen?')) return
    await supabase.from('gallery').delete().eq('id', id)
    fetchData()
  }

  const updateCaption = async (id: string, caption: string) => {
    await supabase.from('gallery').update({ caption }).eq('id', id)
  }

  if (loading) return <div className="text-gray-400">Cargando galería...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Galería</h1>
          <p className="text-gray-400 text-sm">Sube fotos de tus trabajos para mostrar en el sitio</p>
        </div>
        <label className="btn-primary flex items-center gap-2 text-sm cursor-pointer">
          <Plus size={16} />
          {uploading ? 'Subiendo...' : 'Subir Fotos'}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map(item => (
          <div key={item.id} className={`admin-card p-0 overflow-hidden group ${!item.active ? 'opacity-50' : ''}`}>
            <div className="relative aspect-square">
              <img
                src={item.image_url}
                alt={item.caption || ''}
                className="w-full h-full object-cover"
              />
              {/* Overlay actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => toggleActive(item)}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                  title={item.active ? 'Ocultar' : 'Mostrar'}
                >
                  {item.active ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400"
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="p-3">
              <input
                type="text"
                defaultValue={item.caption || ''}
                onBlur={e => updateCaption(item.id, e.target.value)}
                className="input-field text-xs"
                placeholder="Descripción de la foto..."
              />
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="col-span-full py-16 text-center text-gray-500">
            <p className="mb-2">No hay fotos en la galería</p>
            <p className="text-sm">Sube las primeras fotos de tus trabajos</p>
          </div>
        )}
      </div>
    </div>
  )
}
