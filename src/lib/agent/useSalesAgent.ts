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
  const [ttsOn, setTtsOn] = useState(true)
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

  // Precarga de voces del navegador la primera vez que abren el chat.
  // Algunos navegadores (Chrome en mobile) no listan voces hasta que
  // disparas un speak() dummy con texto vacío.
  useEffect(() => {
    if (!open || warmedRef.current) return
    warmedRef.current = true
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.getVoices()
      } catch {}
    }
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
    (text: string) => {
      if (!ttsOn || !text.trim()) return
      stopAudio()
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
      const cleaned = text.replace(/\*\*/g, '').replace(/[🪖💬📎🔧✅😕🙂🎨]/gu, '')
      const utter = new SpeechSynthesisUtterance(cleaned)
      // Prefiere una voz española si el dispositivo la tiene
      const voices = window.speechSynthesis.getVoices()
      const esVoice =
        voices.find((v) => /es[-_]CO/i.test(v.lang)) ??
        voices.find((v) => /es[-_]MX/i.test(v.lang)) ??
        voices.find((v) => /^es/i.test(v.lang))
      if (esVoice) utter.voice = esVoice
      utter.lang = esVoice?.lang ?? 'es-CO'
      utter.rate = 1.05
      utter.pitch = 1
      window.speechSynthesis.speak(utter)
    },
    [ttsOn, stopAudio],
  )

  const sendText = useCallback(
    async (text: string, photoUrl?: string) => {
      if (!text.trim() || busy) return
      const nextMsgs: AgentMsg[] = [
        ...msgs,
        { role: 'user', content: text, ...(photoUrl ? { photoUrl } : {}) },
      ]
      setMsgs(nextMsgs)
      setBusy(true)

      try {
        const res = await fetch('/api/agent/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            messages: nextMsgs.map((m) => ({ role: m.role, content: m.content })),
            latest_photo_url: photoUrl ?? null,
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
    async (fileIn: File) => {
      setBusy(true)
      try {
        // Comprimir/redimensionar en el navegador para esquivar el límite
        // de 4.5MB del body de Vercel y acelerar el upload en mobile.
        const file = await compressImage(fileIn).catch(() => fileIn)

        const fd = new FormData()
        fd.append('file', file)
        fd.append('session_id', sessionId)
        const res = await fetch('/api/agent/upload', { method: 'POST', body: fd })

        let data: { url?: string; error?: string } = {}
        try {
          data = await res.json()
        } catch {
          data = { error: `HTTP ${res.status}` }
        }

        if (!res.ok || data.error || !data.url) {
          const reason = data.error ?? `HTTP ${res.status}`
          setMsgs((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: `No pude subir esa imagen (${reason}). Intenta con otra más pequeña o con mejor conexión.`,
            },
          ])
          setBusy(false)
          return
        }

        setBusy(false)
        await sendText('📎 Te acabo de enviar una foto del casco.', data.url)
      } catch (err) {
        const m = err instanceof Error ? err.message : 'error'
        setMsgs((prev) => [
          ...prev,
          { role: 'assistant', content: `No pude subir esa imagen (${m}). Intenta con otra.` },
        ])
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

// Downscale + JPEG (q=0.85). Esquiva el límite de 4.5MB de Vercel y
// reduce el tamaño para que los providers de vision no rechacen la imagen.
async function compressImage(file: File, maxDim = 1280, quality = 0.85): Promise<File> {
  if (typeof window === 'undefined') return file
  if (!file.type.startsWith('image/')) return file

  const bitmap = await createImageBitmap(file).catch(async () => {
    // Fallback para navegadores sin createImageBitmap
    const img = new Image()
    const url = URL.createObjectURL(file)
    try {
      await new Promise<void>((ok, err) => {
        img.onload = () => ok()
        img.onerror = () => err(new Error('img_load_failed'))
        img.src = url
      })
      return img as unknown as ImageBitmap
    } finally {
      URL.revokeObjectURL(url)
    }
  })

  const w = (bitmap as ImageBitmap).width
  const h = (bitmap as ImageBitmap).height
  if (!w || !h) return file
  const scale = Math.min(1, maxDim / Math.max(w, h))
  const outW = Math.round(w * scale)
  const outH = Math.round(h * scale)

  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, outW, outH)

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/jpeg', quality),
  )
  if (!blob) return file
  const name = (file.name || 'photo').replace(/\.[^.]+$/, '') + '.jpg'
  return new File([blob], name, { type: 'image/jpeg' })
}
