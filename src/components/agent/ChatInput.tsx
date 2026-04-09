'use client'

import { useRef, useState } from 'react'

type Props = {
  busy: boolean
  onSend: (text: string) => void
  onUpload: (file: File) => void
}

export default function ChatInput({ busy, onSend, onUpload }: Props) {
  const [input, setInput] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || busy) return
    onSend(input)
    setInput('')
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    onUpload(file)
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          e.preventDefault()
          onUpload(file)
          return
        }
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 border-t border-white/10">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        className="h-10 w-10 flex-shrink-0 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-lg disabled:opacity-40"
        aria-label="Adjuntar foto"
        title="Adjuntar foto del casco"
      >
        📎
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        className="hidden"
        onChange={handleFile}
      />
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onPaste={handlePaste}
        placeholder="Escribe tu mensaje o pega una foto..."
        disabled={busy}
        className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-[#FF6B35]/60 disabled:opacity-40"
      />
      <button
        type="submit"
        disabled={busy || !input.trim()}
        className="h-10 w-10 flex-shrink-0 rounded-full bg-[#FF6B35] hover:bg-[#FF8555] flex items-center justify-center disabled:opacity-40 transition-colors"
        aria-label="Enviar"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
        </svg>
      </button>
    </form>
  )
}
