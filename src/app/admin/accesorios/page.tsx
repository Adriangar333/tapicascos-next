'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react'

type Accessory = {
  id: string
  name: string
  price: number
  category: string
  active: boolean | null
  sort_order: number | null
  created_at: string | null
}

const CATEGORIES = ['tornillería', 'visores', 'espuma', 'forros', 'herrajes', 'otros']

export default function AccesoriosAdmin() {
  const [items, setItems] = useState<Accessory[]>([])
  const [editing, setEditing] = useState<Partial<Accessory> | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const { data, error } = await supabase
      .from('accessories')
      .select('*')
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true })
    if (error) setErrorMsg(error.message)
    if (data) setItems(data as Accessory[])
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
    if (!editing.category) {
      setErrorMsg('La categoría es obligatoria.')
      return
    }
    if (typeof editing.price !== 'number' || editing.price < 0) {
      setErrorMsg('El precio debe ser un número mayor o igual a 0.')
      return
    }
    setSaving(true)

    const payload = {
      name: editing.name.trim(),
      price: editing.price,
      category: editing.category,
      active: editing.active ?? true,
      sort_order: editing.sort_order ?? 0,
    }

    const { error } = isNew
      ? await supabase.from('accessories').insert(payload)
      : await supabase.from('accessories').update(payload).eq('id', editing.id)

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
    if (!confirm('¿Eliminar este accesorio?')) return
    const { error } = await supabase.from('accessories').delete().eq('id', id)
    if (error) setErrorMsg(error.message)
    fetchData()
  }

  const toggleActive = async (acc: Accessory) => {
    const { error } = await supabase
      .from('accessories')
      .update({ active: !acc.active })
      .eq('id', acc.id)
    if (error) setErrorMsg(error.message)
    fetchData()
  }

  if (loading) return <div className="text-gray-400">Cargando accesorios...</div>

  const grouped = items.reduce<Record<string, Accessory[]>>((acc, a) => {
    (acc[a.category] ||= []).push(a)
    return acc
  }, {})

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Accesorios</h1>
          <p className="text-gray-400 text-sm">
            Repuestos y complementos que vende el taller ({items.length} en total)
          </p>
        </div>
        <button
          onClick={() => {
            setEditing({ name: '', price: 0, category: CATEGORIES[0], active: true, sort_order: 0 })
            setIsNew(true)
            setErrorMsg(null)
          }}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus size={16} /> Nuevo Accesorio
        </button>
      </div>

      {errorMsg && !editing && (
        <div className="mb-4 text-sm rounded-xl border border-red-400/40 bg-red-400/10 px-3 py-2 text-red-200">
          {errorMsg}
        </div>
      )}

      {/* Editor */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="glass p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">
                {isNew ? 'Nuevo Accesorio' : 'Editar Accesorio'}
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
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="Visor ahumado universal"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Categoría</label>
                <select
                  className="input-field"
                  value={editing.category || ''}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Precio (COP)</label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  className="input-field"
                  value={editing.price ?? 0}
                  onChange={(e) =>
                    setEditing({ ...editing, price: parseInt(e.target.value, 10) || 0 })
                  }
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

      {/* List grouped by category */}
      {items.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          Aún no hay accesorios. Agrega el primero con el botón de arriba.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, list]) => (
            <div key={cat}>
              <h2 className="text-sm uppercase tracking-wider text-gray-500 mb-2">{cat}</h2>
              <div className="space-y-2">
                {list.map((a) => (
                  <div
                    key={a.id}
                    className={`admin-card flex items-center gap-4 ${!a.active ? 'opacity-50' : ''}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{a.name}</p>
                      <p className="text-gray-400 text-sm">
                        ${a.price.toLocaleString('es-CO')} · orden {a.sort_order ?? 0}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleActive(a)}
                      className={`text-xs px-2 py-1 rounded-lg border ${
                        a.active
                          ? 'border-emerald-400/40 text-emerald-300'
                          : 'border-white/20 text-gray-400'
                      }`}
                    >
                      {a.active ? 'activo' : 'oculto'}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(a)
                        setIsNew(false)
                        setErrorMsg(null)
                      }}
                      className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="p-2 rounded-lg hover:bg-red-400/10 text-gray-400 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
