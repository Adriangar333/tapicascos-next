'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type AgentMsg = {
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

/**
 * Hook con toda la lógica del asesor virtual: estado de mensajes,
 * sesión persistida, envío, upload de foto, TTS con fallback y
 * handoff a WhatsApp. La UI es agnóstica.
 */
export function useSalesAgent() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<AgentMsg[]>([{ role: 'assistant', content: GREETING }])
  const [busy, setBusy] = useState(false)
  const [quoteId, setQuoteId] = useState<string | null>(null)
  const [ttsOn, setTtsOn] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const warmedRef = useRef(false)

  const [sessionId] = useState<string>(() => {
    if (typeof window === 'undefined') return uuid()
    const k = 'tapi_session_id'
    const existing = window.sessionStorage.getItem(k)
    if (existing) return existing
    const fresh = uuid()
    window.sessionStorage.setItem(k, fresh)
    return fresh
  })

  // Warmup del Space de VibeVoice la primera vez que abren el chat.
  // Así cuando activen la voz ya está tibio.
  useEffect(() => {
    if (!open || warmedRef.current) return
    warmedRef.current = true
    fetch('/api/agent/tts', { method: 'GET' }).catch(() => {})
  }, [open])

  const stopAudio = useCallback(() => {
    try {
      audioRef.current?.pause()
      audioRef.current = null
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    } catch {}
  }, [])

  const speak = useCallback(
    async (text: string) => {
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
        if (data.reason) {
          console.info('[tapi] tts fallback →', data.reason, data.space ?? '')
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
    },
    [ttsOn, stopAudio],
  )

  const sendText = useCallback(
    async (text: string) => {
      if (!text.trim() || busy) return
      const nextMsgs: AgentMsg[] = [...msgs, { role: 'user', content: text }]
      setMsgs(nextMsgs)
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
    },
    [busy, msgs, sessionId, speak],
  )

  const uploadPhoto = useCallback(
    async (file: File) => {
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
          return
        }

        setMsgs((prev) => {
          const copy = [...prev]
          const lastUserIdx = copy.length - 1
          if (copy[lastUserIdx]?.role === 'user') {
            copy[lastUserIdx] = { ...copy[lastUserIdx], photoUrl: data.url }
          }
          return copy
        })
        await sendText(
          'Acabo de enviar una foto del casco. Cuando la veas, ayúdame a entender qué servicio aplica.',
        )
      } catch {
        setMsgs((prev) => [
          ...prev,
          { role: 'assistant', content: 'No pude subir esa imagen. Intenta con otra.' },
        ])
      } finally {
        setBusy(false)
      }
    },
    [sessionId, sendText],
  )

  const toggleTts = useCallback(() => {
    setTtsOn((prev) => {
      const next = !prev
      if (!next) stopAudio()
      return next
    })
  }, [stopAudio])

  const waHandoffLink = quoteId
    ? `https://wa.me/${SHOP_WHATSAPP}?text=${encodeURIComponent(
        `Hola, acabo de hablar con Tapi en la web (ref: ${quoteId.slice(0, 8)}). Quiero continuar con mi cotización.`,
      )}`
    : null

  return {
    open,
    setOpen,
    msgs,
    busy,
    ttsOn,
    toggleTts,
    sendText,
    uploadPhoto,
    waHandoffLink,
  }
}
