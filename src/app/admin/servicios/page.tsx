'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Service, Category } from '@/lib/types'
import { Plus, Pencil, Trash2, Save, X, Star, Wrench } from 'lucide-react'

const emptyService: Partial<Service> = {
  name: '', description: '', price_min: 0, price_max: 0,
  category_id: '', image_url: '', sort_order: 0, active: true, featured: false,
}

export default function ServiciosAdmin() {
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [editing, setEditing] = useState<Partial<Service> | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const [svcRes, catRes] = await Promise.all([
      supabase.from('services').select('*, category:categories(*)').order('sort_order'),
      supabase.from('categories').select('*').order('sort_order'),
    ])
    if (svcRes.data) setServices(svcRes.data)
    if (catRes.data) setCategories(catRes.data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSave = async () => {
    if (!editing) return
    setErrorMsg(null)
    if (!editing.name?.trim()) {
      setErrorMsg('El nombre es obligatorio.')
      return
    }
    if (!editing.category_id) {
      setErrorMsg('Selecciona una categoría antes de guardar.')
      return
    }
    setSaving(true)
    const payload = {
      name: editing.name,
      description: editing.description,
      price_min: editing.price_min,
      price_max: editing.price_max || null,
      category_id: editing.category_id,
      image_url: editing.image_url || null,
      sort_order: editing.sort_order || 0,
      active: editing.active ?? true,
      featured: editing.featured ?? false,
    }

    const { error } = isNew
      ? await supabase.from('services').insert(payload)
      : await supabase.from('services').update(payload).eq('id', editing.id)

    setSaving(false)
    if (error) {
      setErrorMsg(error.message)
      return
    }
    setEditing(null)
    setIsNew(false)
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este servicio?')) return
    await supabase.from('services').delete().eq('id', id)
    fetchData()
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editing) return

    const ext = file.name.split('.').pop()
    const path = `services/${Date.now()}.${ext}`

    const { data, error } = await supabase.storage.from('images').upload(path, file)
    if (error) { alert('Error subiendo imagen'); return }

    const { data: urlData } = supabase.storage.from('images').getPublicUrl(path)
    setEditing({ ...editing, image_url: urlData.publicUrl })
  }

  if (loading) {
    return <div className="text-gray-400">Cargando servicios...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Servicios</h1>
          <p className="text-gray-400 text-sm">Gestiona los servicios y precios de Tapicascos</p>
        </div>
        <button
          onClick={() => {
            if (categories.length === 0) {
              setErrorMsg('Crea primero una categoría desde la base de datos antes de añadir un servicio.')
              return
            }
            setEditing({ ...emptyService, category_id: categories[0]?.id })
            setIsNew(true)
            setErrorMsg(null)
          }}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus size={16} /> Nuevo Servicio
        </button>
      </div>

      {/* Editor Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="glass p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">{isNew ? 'Nuevo Servicio' : 'Editar Servicio'}</h2>
              <button onClick={() => { setEditing(null); setIsNew(false) }} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Nombre</label>
                <input
                  className="input-field"
                  value={editing.name || ''}
                  onChange={e => setEditing({ ...editing, name: e.target.value })}
                  placeholder="Tapizado Integral"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-1">Categoría</label>
                <select
                  className="input-field"
                  value={editing.category_id || ''}
                  onChange={e => setEditing({ ...editing, category_id: e.target.value })}
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id} className="bg-[#1A1F3A]">{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-1">Descripción</label>
                <textarea
                  className="input-field min-h-[80px]"
                  value={editing.description || ''}
                  onChange={e => setEditing({ ...editing, description: e.target.value })}
                  placeholder="Descripción del servicio..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Precio mínimo</label>
                  <input
                    type="number"
                    className="input-field"
                    value={editing.price_min || ''}
                    onChange={e => setEditing({ ...editing, price_min: Number(e.target.value) })}
                    placeholder="45000"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Precio máximo (opcional)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={editing.price_max || ''}
                    onChange={e => setEditing({ ...editing, price_max: Number(e.target.value) || null })}
                    placeholder="85000"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-1">Imagen</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="input-field text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#FF6B35]/20 file:text-[#FF6B35] file:px-3 file:py-1 file:text-sm file:cursor-pointer"
                />
                {editing.image_url && (
                  <img src={editing.image_url} alt="Preview" className="mt-2 h-24 w-auto rounded-lg object-cover" />
                )}
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editing.active ?? true}
                    onChange={e => setEditing({ ...editing, active: e.target.checked })}
                    className="accent-[#FF6B35]"
                  />
                  <span className="text-gray-300">Activo</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editing.featured ?? false}
                    onChange={e => setEditing({ ...editing, featured: e.target.checked })}
                    className="accent-[#FFD700]"
                  />
                  <span className="text-gray-300">Destacado</span>
                </label>
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-1">Orden</label>
                <input
                  type="number"
                  className="input-field w-24"
                  value={editing.sort_order || 0}
                  onChange={e => setEditing({ ...editing, sort_order: Number(e.target.value) })}
                />
              </div>
            </div>

            {errorMsg && (
              <p className="mt-4 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {errorMsg}
              </p>
            )}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={saving || !editing.name}
                className="btn-primary flex items-center gap-2 text-sm flex-1 justify-center disabled:opacity-50"
              >
                <Save size={16} /> {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={() => { setEditing(null); setIsNew(false) }}
                className="px-4 py-2.5 rounded-xl border border-white/20 text-gray-300 hover:text-white transition-colors text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Services Table */}
      <div className="admin-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left">
              <th className="pb-3 text-gray-400 font-medium">Servicio</th>
              <th className="pb-3 text-gray-400 font-medium">Categoría</th>
              <th className="pb-3 text-gray-400 font-medium">Precio</th>
              <th className="pb-3 text-gray-400 font-medium">Estado</th>
              <th className="pb-3 text-gray-400 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {services.map(svc => (
              <tr key={svc.id} className="hover:bg-white/[0.02]">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-3">
                    {svc.image_url ? (
                      <img src={svc.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-600">
                        <Wrench size={16} />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-white flex items-center gap-1.5">
                        {svc.name}
                        {svc.featured && <Star size={12} className="text-[#FFD700]" fill="#FFD700" />}
                      </p>
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">{svc.description}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4 text-gray-400">
                  {(svc.category as unknown as Category)?.name || '—'}
                </td>
                <td className="py-3 pr-4 text-[#FF6B35] font-medium">
                  ${svc.price_min?.toLocaleString('es-CO')}
                  {svc.price_max ? ` — $${svc.price_max.toLocaleString('es-CO')}` : ''}
                </td>
                <td className="py-3 pr-4">
                  <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full ${
                    svc.active ? 'bg-green-400/10 text-green-400' : 'bg-gray-400/10 text-gray-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${svc.active ? 'bg-green-400' : 'bg-gray-400'}`} />
                    {svc.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => { setEditing(svc); setIsNew(false) }}
                      className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(svc.id)}
                      className="p-2 rounded-lg hover:bg-red-400/10 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {services.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-500">
                  No hay servicios aún. Haz clic en &quot;Nuevo Servicio&quot; para crear el primero.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
