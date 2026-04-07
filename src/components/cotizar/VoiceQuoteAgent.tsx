'use client'

import { useEffect, useRef, useState } from 'react'

type Status = 'idle' | 'listening' | 'speaking' | 'error'
type Phase = 'idle' | 'running' | 'done'

const SERVICE_KEYWORDS: Record<string, string> = {
  'tapizado integral': 'tapizado_integral',
  integral: 'tapizado_integral',
  'tapizado parcial': 'tapizado_parcial',
  parcial: 'tapizado_parcial',
  pintura: 'pintura_personalizada',
  pintar: 'pintura_personalizada',
  ajuste: 'ajuste_talla',
  talla: 'ajuste_talla',
  silla: 'silla_moto',
  moto: 'silla_moto',
  accesorio: 'accesorios',
  repuesto: 'accesorios',
  visor: 'accesorios',
}

const SERVICE_LABELS: Record<string, string> = {
  tapizado_integral: 'Tapizado integral',
  tapizado_parcial: 'Tapizado parcial',
  pintura_personalizada: 'Pintura personalizada',
  ajuste_talla: 'Ajuste de talla',
  silla_moto: 'Tapizado de silla de moto',
  accesorios: 'Accesorios o repuestos',
  otro: 'Otro',
}

interface Msg {
  who: 'agent' | 'user'
  text: string
}

// Detecta si el navegador tiene Web Speech API para STT
function hasSTT(): boolean {
  if (typeof window === 'undefined') return false
  return !!(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  )
}

// Elige la mejor voz en español disponible
function pickSpanishVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null
  // Prioridad: neural de Google/Microsoft en español colombiano/mexicano
  const prefs = [
    (v: SpeechSynthesisVoice) => /es-co/i.test(v.lang),
    (v: SpeechSynthesisVoice) => /es-mx/i.test(v.lang),
    (v: SpeechSynthesisVoice) => /es-us/i.test(v.lang),
    (v: SpeechSynthesisVoice) => /es-419|es-la/i.test(v.lang),
    (v: SpeechSynthesisVoice) => v.lang.startsWith('es'),
  ]
  for (const pred of prefs) {
    const v = voices.find(pred)
    if (v) return v
  }
  return voices[0] ?? null
}

export default function VoiceQuoteAgent() {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [phase, setPhase] = useState<Phase>('idle')
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [manualInput, setManualInput] = useState('')
  const [manualResolver, setManualResolver] = useState<((v: string) => void) | null>(null)
  const [sttSupported, setSttSupported] = useState(true)

  const recogRef = useRef<any>(null)
  const cancelledRef = useRef(false)

  useEffect(() => {
    setSttSupported(hasSTT())
  }, [])

  // Escribe en un input/textarea/select del form de forma que React y el server action lo detecten
  const setField = (name: string, value: string) => {
    const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      `[name="${name}"]`
    )
    if (!el) return
    const proto = el instanceof HTMLSelectElement
      ? HTMLSelectElement.prototype
      : el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
    setter?.call(el, value)
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
  }

  const addMsg = (who: 'agent' | 'user', text: string) =>
    setMsgs((m) => [...m, { who, text }])

  // ============ TTS (Browser only) ============
  const speak = (text: string): Promise<void> =>
    new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return resolve()
      }
      setStatus('speaking')
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'es-CO'
      u.rate = 1
      u.pitch = 1
      const voice = pickSpanishVoice()
      if (voice) u.voice = voice
      u.onend = () => {
        setStatus('idle')
        resolve()
      }
      u.onerror = () => {
        setStatus('idle')
        resolve()
      }
      window.speechSynthesis.speak(u)
    })

  // ============ STT ============
  const listen = (): Promise<string> =>
    new Promise((resolve, reject) => {
      const SR =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!SR) return reject(new Error('NO_STT'))
      const recog = new SR()
      recog.lang = 'es-CO'
      recog.continuous = false
      recog.interimResults = false
      recogRef.current = recog
      setStatus('listening')
      let settled = false
      recog.onresult = (e: any) => {
        settled = true
        resolve(e.results[0][0].transcript)
      }
      recog.onerror = (e: any) => {
        settled = true
        reject(new Error(e.error || 'STT_ERROR'))
      }
      recog.onend = () => {
        if (!settled) reject(new Error('NO_INPUT'))
      }
      try {
        recog.start()
      } catch (e) {
        reject(e)
      }
    })

  // Input manual (fallback iOS/Safari o usuarios sin mic)
  const manualListen = (): Promise<string> =>
    new Promise((resolve) => {
      setStatus('listening')
      setManualResolver(() => (v: string) => {
        setStatus('idle')
        setManualInput('')
        setManualResolver(null)
        resolve(v)
      })
    })

  const askAndListen = async (prompt: string): Promise<string> => {
    if (cancelledRef.current) throw new Error('CANCELLED')
    addMsg('agent', prompt)
    await speak(prompt)
    if (cancelledRef.current) throw new Error('CANCELLED')
    const reply = sttSupported ? await listen().catch((e) => {
      // Si STT falla mid-flow, caer a manual
      if (e.message === 'NO_STT' || e.message === 'not-allowed') {
        setSttSupported(false)
        return manualListen()
      }
      throw e
    }) : await manualListen()
    addMsg('user', reply)
    return reply
  }

  // ============ FLOW ============
  const startFlow = async () => {
    cancelledRef.current = false
    setPhase('running')
    setMsgs([])
    try {
      await speak(
        '¡Hola! Soy el asistente de Tapicascos. Te ayudo a llenar tu cotización rápido. Empecemos.'
      )
      addMsg(
        'agent',
        '¡Hola! Soy el asistente de Tapicascos. Te ayudo a llenar tu cotización rápido.'
      )

      const name = await askAndListen('¿Cuál es tu nombre completo?')
      setField('name', name)

      const phoneRaw = await askAndListen('Perfecto. ¿Cuál es tu número de WhatsApp?')
      const phone = phoneRaw.replace(/\D/g, '')
      setField('phone', phone)

      const serviceRaw = await askAndListen(
        '¿Qué servicio necesitas? Puede ser tapizado integral, parcial, pintura, ajuste de talla, silla de moto o accesorios.'
      )
      const sLow = serviceRaw.toLowerCase()
      let serviceCode = 'otro'
      for (const k of Object.keys(SERVICE_KEYWORDS)) {
        if (sLow.includes(k)) {
          serviceCode = SERVICE_KEYWORDS[k]
          break
        }
      }
      setField('service_type', serviceCode)

      const brandModel = await askAndListen('¿De qué marca y modelo es tu casco?')
      const parts = brandModel.trim().split(/\s+/)
      setField('helmet_brand', parts[0] ?? '')
      setField('helmet_model', parts.slice(1).join(' '))

      const description = await askAndListen(
        'Por último, cuéntame con detalle qué quieres hacerle a tu casco.'
      )
      setField('description', description)

      const confirmation = `Listo. Registré: ${name}, WhatsApp ${phone}, servicio ${SERVICE_LABELS[serviceCode]}. Revisa el formulario y dale enviar cuando quieras.`
      addMsg('agent', confirmation)
      await speak(confirmation)
      setPhase('done')
    } catch (e: any) {
      if (e?.message === 'CANCELLED') {
        setPhase('idle')
        return
      }
      setStatus('error')
      const msg =
        e?.message === 'NO_STT'
          ? 'Tu navegador no soporta dictado por voz. Puedes escribir las respuestas manualmente.'
          : e?.message === 'not-allowed'
          ? 'Necesito permiso para usar el micrófono. Actívalo en la barra del navegador.'
          : e?.message === 'NO_INPUT'
          ? 'No te escuché. Puedes intentar de nuevo.'
          : 'Hubo un problema. Puedes intentar de nuevo o llenar el formulario manualmente.'
      addMsg('agent', msg)
      speak(msg).catch(() => {})
      setPhase('idle')
    }
  }

  const stop = () => {
    cancelledRef.current = true
    try {
      recogRef.current?.abort?.()
    } catch {}
    try {
      window.speechSynthesis?.cancel?.()
    } catch {}
    if (manualResolver) {
      manualResolver('')
    }
    setStatus('idle')
    setPhase('idle')
  }

  const statusLabel: Record<Status, string> = {
    idle: 'Listo',
    listening: 'Escuchando...',
    speaking: 'Hablando...',
    error: 'Error',
  }
  const statusColor: Record<Status, string> = {
    idle: 'bg-gray-500',
    listening: 'bg-green-400 animate-pulse',
    speaking: 'bg-[#FF6B35] animate-pulse',
    error: 'bg-red-500',
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualInput.trim() || !manualResolver) return
    addMsg('user', manualInput)
    manualResolver(manualInput)
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-br from-[#FF6B35] to-[#FFD700] text-black font-bold rounded-full shadow-2xl px-5 py-4 flex items-center gap-2 hover:scale-105 transition-transform"
          aria-label="Abrir asistente de voz"
        >
          <span className="text-xl" aria-hidden>🎙️</span>
          <span className="text-sm">Cotizar por voz</span>
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Asistente de voz"
          className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[92vw] h-[540px] bg-[#0A0E1A] border border-[#FF6B35]/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-[#FF6B35]/10 to-transparent">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${statusColor[status]}`} />
              <div>
                <p className="text-sm font-bold text-white">Asistente de voz</p>
                <p className="text-[10px] uppercase tracking-wider text-gray-400">
                  {statusLabel[status]}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                stop()
                setOpen(false)
              }}
              className="text-gray-400 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center"
              aria-label="Cerrar asistente"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {msgs.length === 0 && (
              <div className="text-center text-gray-500 text-sm mt-8 px-4">
                <p className="mb-3">
                  Llena tu cotización hablando. Yo pregunto, tú respondes, y voy llenando
                  el formulario automáticamente.
                </p>
                {!sttSupported && (
                  <p className="text-xs text-amber-400 mt-4">
                    Tu navegador no soporta dictado por voz. Podrás responder escribiendo.
                  </p>
                )}
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.who === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                    m.who === 'user'
                      ? 'bg-[#FF6B35]/20 text-white rounded-tr-none'
                      : 'bg-white/5 text-gray-200 rounded-tl-none'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 space-y-2">
            {manualResolver ? (
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  autoFocus
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Escribe tu respuesta..."
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#FF6B35]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#FF6B35] text-black font-bold text-sm"
                >
                  Enviar
                </button>
              </form>
            ) : phase === 'running' ? (
              <button
                onClick={stop}
                className="w-full bg-white/5 text-white border border-white/20 font-semibold py-3 rounded-xl hover:bg-white/10"
              >
                Detener
              </button>
            ) : (
              <button
                onClick={startFlow}
                className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FFD700] text-black font-bold py-3 rounded-xl hover:opacity-90"
              >
                {phase === 'done' ? 'Repetir' : 'Iniciar conversación'}
              </button>
            )}
            <p className="text-[10px] text-gray-500 text-center">
              Voz en español · 100% privado, corre en tu navegador
            </p>
          </div>
        </div>
      )}
    </>
  )
}
