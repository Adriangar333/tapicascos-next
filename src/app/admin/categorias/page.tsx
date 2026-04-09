'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react'
import { slugify } from '@/lib/utils/slug'

type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  sort_order: number | null
  active: boolean | null
  created_at: string | null
}

export default function CategoriasAdmin() {
  const [items, setItems] = useState<Category[]>([])
  const [editing, setEditing] = useState<Partial<Category> | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
    if (error) setErrorMsg(error.message)
    if (data) setItems(data as Category[])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSave = async () => {
    if (!editing) return
    setErrorMsg(null)
    if (!editing.name?.trim()) {
      setErrorMsg('El nombre es obligatorio.')
      return
    }
    const slug = editing.slug?.trim() || slugify(editing.name)
    if (!slug) {
      setErrorMsg('Slug inválido.')
      return
    }
    setSaving(true)

    const payload = {
      name: editing.name.trim(),
      slug,
      description: editing.description?.trim() || null,
      icon: editing.icon?.trim() || null,
      sort_order: editing.sort_order ?? 0,
      active: editing.active ?? true,
    }

    const { error } = isNew
      ? await supabase.from('categories').insert(payload)
      : await supabase.from('categories').update(payload).eq('id', editing.id)

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
    if (!confirm('¿Eliminar esta categoría?')) return
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) setErrorMsg(error.message)
    fetchData()
  }

  const toggleActive = async (c: Category) => {
    const { error } = await supabase
      .from('categories')
      .update({ active: !c.active })
      .eq('id', c.id)
    if (error) setErrorMsg(error.message)
    fetchData()
  }

  if (loading) return <div className="text-gray-400">Cargando categorías...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Categorías</h1>
          <p className="text-gray-400 text-sm">
            Agrupan servicios y productos ({items.length} en total)
          </p>
        </div>
        <button
          onClick={() => {
            setEditing({ name: '', slug: '', description: '', icon: '', sort_order: 0, active: true })
            setIsNew(true)
            setErrorMsg(null)
          }}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus size={16} /> Nueva Categoría
        </button>
      </div>

      {errorMsg && !editing && (
        <div className="mb-4 text-sm rounded-xl border border-red-400/40 bg-red-400/10 px-3 py-2 text-red-200">
          {errorMsg}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="glass p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">
                {isNew ? 'Nueva Categoría' : 'Editar Categoría'}
              </h2>
              <button
                onClick={() => {
                  setEditing(null)
                  setIsNew(false)
                  setErrorMsg(null)
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 text-sm rounded-xl border border-red-400/40 bg-red-400/10 px-3 py-2 text-red-200">
                {errorMsg}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Nombre</label>
                <input
                  className="input-field"
                  value={editing.name || ''}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      name: e.target.value,
                      slug: isNew ? slugify(e.target.value) : editing.slug,
                    })
                  }
                  placeholder="Tapizado premium"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Slug</label>
                <input
                  className="input-field"
                  value={editing.slug || ''}
                  onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })}
                  placeholder="tapizado-premium"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Descripción</label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={editing.description || ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Icono (nombre lucide o emoji)</label>
                <input
                  className="input-field"
                  value={editing.icon || ''}
                  onChange={(e) => setEditing({ ...editing, icon: e.target.value })}
                  placeholder="🪖"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Orden</label>
                <input
                  type="number"
                  className="input-field"
                  value={editing.sort_order ?? 0}
                  onChange={(e) =>
                    setEditing({ ...editing, sort_order: parseInt(e.target.value, 10) || 0 })
                  }
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editing.active ?? true}
                  onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                  className="accent-[#FF6B35]"
                />
                <span className="text-gray-300">Visible en el sitio</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex items-center gap-2 text-sm flex-1 justify-center disabled:opacity-50"
              >
                <Save size={16} /> {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={() => {
                  setEditing(null)
                  setIsNew(false)
                  setErrorMsg(null)
                }}
                className="px-4 py-2.5 rounded-xl border border-white/20 text-gray-300 hover:text-white text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          Aún no hay categorías. Agrega la primera con el botón de arriba.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((c) => (
            <div
              key={c.id}
              className={`admin-card flex items-center gap-4 ${!c.active ? 'opacity-50' : ''}`}
            >
              <span className="text-2xl w-10 text-center">{c.icon || '📦'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{c.name}</p>
                <p className="text-gray-400 text-sm truncate">
                  /{c.slug} · orden {c.sort_order ?? 0}
                  {c.description ? ` · ${c.description}` : ''}
                </p>
              </div>
              <button
                onClick={() => toggleActive(c)}
                className={`text-xs px-2 py-1 rounded-lg border ${
                  c.active
                    ? 'border-emerald-400/40 text-emerald-300'
                    : 'border-white/20 text-gray-400'
                }`}
              >
                {c.active ? 'activa' : 'oculta'}
              </button>
              <button
                onClick={() => {
                  setEditing(c)
                  setIsNew(false)
                  setErrorMsg(null)
                }}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => handleDelete(c.id)}
                className="p-2 rounded-lg hover:bg-red-400/10 text-gray-400 hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
