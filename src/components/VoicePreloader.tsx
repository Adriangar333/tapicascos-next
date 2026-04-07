'use client'

import { useEffect } from 'react'

/**
 * Precarga el agente de voz para evitar latencia cuando el usuario llega a /cotizar.
 * - Wakes up the HuggingFace VibeVoice Space (que se duerme a las 48h de inactividad)
 * - Precarga voces del navegador (SpeechSynthesis tarda en hidratar la primera vez)
 * - Cachea el estado en window.__voiceReady para que /cotizar no vuelva a hacerlo
 */
export const VIBEVOICE_SPACE = 'https://anycoderapps-vibevoice-realtime-0-5b.hf.space'

export default function VoicePreloader() {
  useEffect(() => {
    // @ts-expect-error - global flag
    if (window.__voiceReady) return
    // @ts-expect-error - global flag
    window.__voiceReady = true

    // 1. Wake up HF Space (no-cors HEAD ping)
    fetch(VIBEVOICE_SPACE, { method: 'GET', mode: 'no-cors' }).catch(() => {})

    // 2. Pre-hidratar voces del navegador
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices()
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
    }
  }, [])

  return (
    <>
      {/* Preconnect a HF para handshake TLS temprano */}
      <link rel="preconnect" href={VIBEVOICE_SPACE} crossOrigin="anonymous" />
      <link rel="dns-prefetch" href={VIBEVOICE_SPACE} />
    </>
  )
}
