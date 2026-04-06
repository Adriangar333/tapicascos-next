'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, X } from 'lucide-react'

export default function UploadForm() {
  const router = useRouter()
  const supabase = createClient()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [sortOrder, setSortOrder] = useState(0)
  const [active, setActive] = useState(true)
  const [beforeUrl, setBeforeUrl] = useState('')
  const [afterUrl, setAfterUrl] = useState('')
  const [uploading, setUploading] = useState<'before' | 'after' | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = async (file: File, slot: 'before' | 'after') => {
    setUploading(slot)
    setError(null)
    const ext = file.name.split('.').pop()
    const path = `before-after/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error: upErr } = await supabase.storage.from('images').upload(path, file)
    if (upErr) {
      setError(upErr.message)
      setUploading(null)
      return
    }
    const { data } = supabase.storage.from('images').getPublicUrl(path)
    if (slot === 'before') setBeforeUrl(data.publicUrl)
    else setAfterUrl(data.publicUrl)
    setUploading(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !beforeUrl || !afterUrl) {
      setError('Título y ambas fotos son requeridas')
      return
    }
    setSaving(true)
    const { error: insErr } = await supabase.from('before_after').insert({
      title,
      description: description || null,
      before_url: beforeUrl,
      after_url: afterUrl,
      sort_order: sortOrder,
      active,
    })
    setSaving(false)
    if (insErr) {
      setError(insErr.message)
      return
    }
    setTitle('')
    setDescription('')
    setBeforeUrl('')
    setAfterUrl('')
    setSortOrder(0)
    setActive(true)
    router.refresh()
  }

  const Slot = ({ slot, url }: { slot: 'before' | 'after'; url: string }) => (
    <div>
      <label className="block text-sm text-gray-300 mb-2">
        Foto {slot === 'before' ? 'ANTES' : 'DESPUÉS'} *
      </label>
      {url ? (
        <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-square bg-black/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={slot} className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => (slot === 'before' ? setBeforeUrl('') : setAfterUrl(''))}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 flex items-center justify-center hover:bg-red-500/80"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-white/15 hover:border-[#FF6B35]/50 hover:bg-white/5 cursor-pointer transition-all">
          <Upload size={28} className="text-gray-500 mb-2" />
          <span className="text-sm text-gray-400">
            {uploading === slot ? 'Subiendo…' : 'Clic o arrastra una foto'}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading === slot}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) uploadFile(f, slot)
              e.target.value = ''
            }}
          />
        </label>
      )}
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-white/10 bg-white/5 mb-10 space-y-4">
      <h2 className="text-lg font-bold">Nuevo par de fotos</h2>

      <div>
        <label className="block text-sm text-gray-300 mb-1">Título *</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10"
          placeholder="Ej: Shaft 551 restaurado"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-1">Descripción</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10"
          placeholder="Tapizado integral con cuero premium"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Slot slot="before" url={beforeUrl} />
        <Slot slot="after" url={afterUrl} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Orden</label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10"
          />
        </div>
        <label className="flex items-center gap-2 mt-6 text-sm">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Activo
        </label>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={saving || uploading !== null}
        className="btn-primary disabled:opacity-50"
      >
        {saving ? 'Guardando…' : 'Agregar'}
      </button>
    </form>
  )
}
