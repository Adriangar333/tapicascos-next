'use client'

import { useState } from 'react'
import { updateQuoteNotes } from './actions'

export default function NotesEditor({ id, initial }: { id: string; initial: string | null }) {
  const [val, setVal] = useState(initial ?? '')
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  async function save() {
    setSaving(true)
    const fd = new FormData()
    fd.append('id', id)
    fd.append('notes', val)
    await updateQuoteNotes(fd)
    setSaving(false)
    setSavedAt(Date.now())
    setTimeout(() => setSavedAt(null), 1500)
  }

  return (
    <div className="mt-2">
      <textarea
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={save}
        placeholder="Notas internas…"
        className="w-full text-[11px] bg-white/5 border border-white/10 rounded-lg px-2 py-1 min-h-[40px] focus:outline-none focus:border-[#FF6B35]/60"
      />
      <p className="text-[9px] text-gray-500 text-right">
        {saving ? 'Guardando…' : savedAt ? '✓ guardado' : ''}
      </p>
    </div>
  )
}
