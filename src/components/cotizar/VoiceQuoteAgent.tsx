'use client'

import { useEffect, useRef, useState } from 'react'
import { VIBEVOICE_SPACE } from '../VoicePreloader'

type Step =
  | 'idle'
  | 'greet'
  | 'name'
  | 'phone'
  | 'service'
  | 'brand_model'
  | 'description'
  | 'confirm'
  | 'done'

type Status = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error'

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
  otro: 'otro',
  'no se': 'otro',
  'no estoy seguro': 'otro',
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

let useHfTts = true

export default function VoiceQuoteAgent() {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [step, setStep] = useState<Step>('idle')
  const [msgs, setMsgs] = useState<Msg[]>([])
  const recogRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const stepRef = useRef<Step>('idle')

  useEffect(() => {
    stepRef.current = step
  }, [step])

  const setField = (name: string, value: string) => {
    const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      `[name="${name}"]`
    )
    if (!el) return
    const setter = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(el),
      'value'
    )?.set
    setter?.call(el, value)
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
  }

  const addMsg = (who: 'agent' | 'user', text: string) =>
    setMsgs((m) => [...m, { who, text }])

  // ============ TTS ============
  const speak = async (text: string) => {
    setStatus('speaking')
    const clean = text.replace(/\s+/g, ' ').trim()
    if (useHfTts) {
      try {
        await speakHF(clean)
        return
      } catch (e) {
        console.warn('HF TTS fallback', e)
        useHfTts = false
      }
    }
    speakBrowser(clean)
  }

  const speakHF = (text: string) =>
    new Promise<void>(async (resolve, reject) => {
      try {
        const res = await fetch(VIBEVOICE_SPACE + '/api/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: [text, 'es'], fn_index: 0 }),
        })
        if (!res.ok) return reject(new Error('hf bad status'))
        const json = await res.json()
        const data = json?.data?.[0]
        let url: string | null = null
        if (typeof data === 'string' && data.startsWith('data:')) url = data
        else if (data?.url) url = data.url
        else if (typeof data === 'string') url = VIBEVOICE_SPACE + '/file=' + data
        if (!url) return reject(new Error('no audio url'))

        const audio = new Audio(url)
        audioRef.current = audio
        audio.onended = () => resolve()
        audio.onerror = () => reject(new Error('audio playback failed'))
        await audio.play()
      } catch (e) {
        reject(e)
      }
    })

  const speakBrowser = (text: string) => {
    if (!('speechSynthesis' in window)) {
      setStatus('idle')
      return
    }
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'es-CO'
    u.rate = 1
    const voices = window.speechSynthesis.getVoices()
    const v = voices.find((x) => x.lang.startsWith('es'))
    if (v) u.voice = v
    u.onend = () => setStatus('idle')
    window.speechSynthesis.speak(u)
  }

  // ============ STT ============
  const listen = (): Promise<string> =>
    new Promise((resolve, reject) => {
      const SR =
        (typeof window !== 'undefined' && (window as any).SpeechRecognition) ||
        (typeof window !== 'undefined' && (window as any).webkitSpeechRecognition)
      if (!SR) return reject(new Error('no STT'))
      const recog = new SR()
      recog.lang = 'es-CO'
      recog.continuous = false
      recog.interimResults = false
      recogRef.current = recog
      setStatus('listening')
      recog.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript
        resolve(transcript)
      }
      recog.onerror = (e: any) => reject(new Error(e.error))
      recog.onend = () => {
        if (status === 'listening') setStatus('idle')
      }
      recog.start()
    })

  // ============ STATE MACHINE ============
  const askAndListen = async (prompt: string): Promise<string> => {
    addMsg('agent', prompt)
    await speak(prompt)
    setStatus('listening')
    const reply = await listen()
    addMsg('user', reply)
    return reply
  }

  const startFlow = async () => {
    try {
      const greeting =
        '¡Hola! Soy el asistente de voz de Tapicascos. Te ayudo a llenar tu cotización en menos de un minuto. ¿Empezamos?'
      addMsg('agent', greeting)
      await speak(greeting)

      const name = await askAndListen('¿Cuál es tu nombre completo?')
      setField('name', name)

      const phoneRaw = await askAndListen('Perfecto. ¿Cuál es tu número de WhatsApp?')
      const phone = phoneRaw.replace(/\D/g, '')
      setField('phone', phone)

      const serviceRaw = await askAndListen(
        '¿Qué servicio necesitas? Puede ser tapizado integral, pintura, ajuste de talla, silla de moto, accesorios u otro.'
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
      const parts = brandModel.split(/\s+/)
      setField('helmet_brand', parts[0] ?? '')
      setField('helmet_model', parts.slice(1).join(' '))

      const description = await askAndListen(
        'Por último, cuéntame con detalle qué quieres hacerle a tu casco.'
      )
      setField('description', description)

      const confirmation = `Listo. Te confirmo: ${name}, WhatsApp ${phone}, servicio ${SERVICE_LABELS[serviceCode]}. Revisa el formulario y dale enviar cuando quieras.`
      addMsg('agent', confirmation)
      await speak(confirmation)
      setStep('done')
      setStatus('idle')
    } catch (e: any) {
      setStatus('error')
      const errMsg =
        e?.message === 'no STT'
          ? 'Tu navegador no soporta reconocimiento de voz. Usa Chrome o llena el formulario manualmente.'
          : 'Hubo un problema con el micrófono. Puedes intentarlo de nuevo o llenar el formulario.'
      addMsg('agent', errMsg)
      speak(errMsg)
    }
  }

  const stop = () => {
    try {
      recogRef.current?.abort?.()
    } catch {}
    try {
      audioRef.current?.pause?.()
      window.speechSynthesis?.cancel?.()
    } catch {}
    setStatus('idle')
  }

  const statusLabel: Record<Status, string> = {
    idle: 'Listo',
    listening: 'Escuchando...',
    thinking: 'Procesando...',
    speaking: 'Hablando...',
    error: 'Error',
  }
  const statusColor: Record<Status, string> = {
    idle: 'bg-gray-500',
    listening: 'bg-green-400 animate-pulse',
    thinking: 'bg-yellow-400 animate-pulse',
    speaking: 'bg-[#FF6B35] animate-pulse',
    error: 'bg-red-500',
  }

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-br from-[#FF6B35] to-[#FFD700] text-black font-bold rounded-full shadow-2xl px-5 py-4 flex items-center gap-2 hover:scale-105 transition-transform"
          aria-label="Abrir asistente de voz"
        >
          <span className="text-xl">🎙️</span>
          <span className="text-sm">Cotizar por voz</span>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[92vw] h-[520px] bg-[#0A0E1A] border border-[#FF6B35]/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
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
              className="text-gray-400 hover:text-white text-xl leading-none"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {msgs.length === 0 && (
              <div className="text-center text-gray-500 text-sm mt-8 px-4">
                <p className="mb-3">
                  Llena tu cotización hablando. Yo te pregunto, tú respondes, y voy llenando
                  el formulario.
                </p>
                <p className="text-xs">Asegúrate de tener permiso de micrófono.</p>
              </div>
            )}
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.who === 'user' ? 'justify-end' : 'justify-start'}`}
              >
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

          {/* Footer controls */}
          <div className="p-4 border-t border-white/10 space-y-2">
            {step === 'idle' || step === 'done' ? (
              <button
                onClick={() => {
                  setStep('greet')
                  setMsgs([])
                  startFlow()
                }}
                className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FFD700] text-black font-bold py-3 rounded-xl hover:opacity-90"
              >
                {step === 'done' ? 'Repetir' : 'Iniciar conversación'}
              </button>
            ) : (
              <button
                onClick={stop}
                className="w-full bg-white/5 text-white border border-white/20 font-semibold py-3 rounded-xl hover:bg-white/10"
              >
                Detener
              </button>
            )}
            <p className="text-[10px] text-gray-500 text-center">
              Powered by VibeVoice + Web Speech API
            </p>
          </div>
        </div>
      )}
    </>
  )
}
