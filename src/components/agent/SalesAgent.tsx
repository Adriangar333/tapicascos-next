'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

type Msg = {
  role: 'user' | 'assistant'
  content: string
  photoUrl?: string
}

const GREETING =
  '¡Hola! Soy **Tapi**, el asesor de Tapicascos Barranquilla 🪖. Cuéntame, ¿qué quieres hacerle a tu casco?'

const SHOP_WHATSAPP = process.env.NEXT_PUBLIC_SHOP_WHATSAPP ?? '573001234567'

function uuid() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function mdBold(s: string) {
  // Soporte mínimo para **bold** sin dependencias
  const parts = s.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? (
      <strong key={i} className="font-bold text-white">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{p}</span>
    )
  )
}

export default function SalesAgent() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([{ role: 'assistant', content: GREETING }])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [quoteId, setQuoteId] = useState<string | null>(null)
  const [ttsOn, setTtsOn] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [sessionId] = useState<string>(() => {
    if (typeof window === 'undefined') return uuid()
    const k = 'tapi_session_id'
    const existing = window.sessionStorage.getItem(k)
    if (existing) return existing
    const fresh = uuid()
    window.sessionStorage.setItem(k, fresh)
    return fresh
  })
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [msgs, open, busy])

  function stopAudio() {
    try {
      audioRef.current?.pause()
      audioRef.current = null
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    } catch {}
  }

  async function speak(text: string) {
    if (!ttsOn || !text.trim()) return
    stopAudio()
    // Intento 1: VibeVoice via backend
    try {
      const res = await fetch('/api/agent/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (data.audio) {
        const audio = new Audio(data.audio)
        audioRef.current = audio
        audio.play().catch(() => {})
        return
      }
    } catch {}
    // Fallback: speechSynthesis del navegador
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const cleaned = text.replace(/\*\*/g, '').replace(/[🪖💬📎🔧✅😕🙂🎨]/gu, '')
      const utter = new SpeechSynthesisUtterance(cleaned)
      utter.lang = 'es-CO'
      utter.rate = 1.05
      window.speechSynthesis.speak(utter)
    }
  }

  async function sendText(text: string) {
    if (!text.trim() || busy) return
    const nextMsgs: Msg[] = [...msgs, { role: 'user', content: text }]
    setMsgs(nextMsgs)
    setInput('')
    setBusy(true)

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          messages: nextMsgs.map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      const replyText = data.reply ?? '...'
      setMsgs((prev) => [...prev, { role: 'assistant', content: replyText }])
      if (data.quote_id) setQuoteId(data.quote_id)
      speak(replyText)
    } catch {
      setMsgs((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Se me cayó la conexión 😕. Intenta de nuevo o escríbenos por WhatsApp directamente.',
        },
      ])
    } finally {
      setBusy(false)
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setMsgs((prev) => [...prev, { role: 'user', content: '📎 Envié una foto del casco' }])
    setBusy(true)

    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('session_id', sessionId)
      const res = await fetch('/api/agent/upload', { method: 'POST', body: fd })
      const data = await res.json()

      if (data.error) {
        setMsgs((prev) => [
          ...prev,
          { role: 'assistant', content: `No pude subir esa imagen: ${data.error}` },
        ])
      } else {
        setMsgs((prev) => {
          const copy = [...prev]
          // Adjuntar preview al último user msg
          const lastUserIdx = copy.length - 1
          if (copy[lastUserIdx]?.role === 'user') {
            copy[lastUserIdx] = { ...copy[lastUserIdx], photoUrl: data.url }
          }
          return copy
        })
        await sendText(
          'Acabo de enviar una foto del casco. Cuando la veas, ayúdame a entender qué servicio aplica.'
        )
      }
    } catch {
      setMsgs((prev) => [
        ...prev,
        { role: 'assistant', content: 'No pude subir esa imagen. Intenta con otra.' },
      ])
    } finally {
      setBusy(false)
    }
  }

  const waHandoffLink = quoteId
    ? `https://wa.me/${SHOP_WHATSAPP}?text=${encodeURIComponent(
        `Hola, acabo de hablar con Tapi en la web (ref: ${quoteId.slice(0, 8)}). Quiero continuar con mi cotización.`
      )}`
    : null

  // No mostrar en el panel admin
  if (pathname?.startsWith('/admin')) return null

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir asesor virtual"
        className={`fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-2xl transition-all hover:scale-110 ${
          open ? 'bg-gray-700' : 'bg-gradient-to-br from-[#FF6B35] to-[#FFD700]'
        }`}
        style={{ boxShadow: '0 0 30px rgba(255,107,53,0.5)' }}
      >
        <span className="text-2xl">{open ? '×' : '💬'}</span>
        {!open && (
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-400 ring-2 ring-[#0A0E1A] animate-pulse" />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-[88px] right-6 z-50 w-[360px] max-w-[calc(100vw-32px)] h-[540px] max-h-[calc(100vh-120px)] rounded-2xl border border-white/10 bg-[#0A0E1A] shadow-2xl flex flex-col overflow-hidden"
          style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 40px rgba(255,107,53,0.15)' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-gradient-to-r from-[#FF6B35]/20 to-transparent">
            <div className="relative h-10 w-10 rounded-full bg-[#FF6B35]/20 flex items-center justify-center">
              <Image
                src="/logo-tapicascos.webp"
                alt="Tapi"
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-[#0A0E1A]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-white">Tapi · Asesor virtual</p>
              <p className="text-[11px] text-green-400">En línea · responde al instante</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !ttsOn
                setTtsOn(next)
                if (!next) stopAudio()
              }}
              aria-label={ttsOn ? 'Silenciar voz' : 'Activar voz'}
              title={ttsOn ? 'Silenciar voz' : 'Activar voz'}
              className={`h-9 w-9 rounded-full flex items-center justify-center text-base transition-colors ${
                ttsOn
                  ? 'bg-[#FF6B35]/30 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {ttsOn ? '🔊' : '🔇'}
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#FF6B35] text-white rounded-br-sm'
                      : 'bg-white/5 border border-white/10 text-gray-100 rounded-bl-sm'
                  }`}
                >
                  {m.photoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.photoUrl}
                      alt="Foto enviada"
                      className="rounded-lg mb-2 max-w-full h-auto"
                    />
                  )}
                  <span className="whitespace-pre-wrap">{mdBold(m.content)}</span>
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/10 px-3.5 py-2.5 rounded-2xl rounded-bl-sm">
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B35] animate-bounce" />
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-[#FF6B35] animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-[#FF6B35] animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Handoff CTA cuando hay lead guardado */}
          {waHandoffLink && (
            <a
              href={waHandoffLink}
              target="_blank"
              rel="noopener"
              className="mx-4 mb-2 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-sm font-bold transition-colors"
            >
              ✅ Continuar por WhatsApp
            </a>
          )}

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendText(input)
            }}
            className="flex items-center gap-2 p-3 border-t border-white/10"
          >
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
              onChange={handleUpload}
            />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu mensaje..."
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
        </div>
      )}
    </>
  )
}
