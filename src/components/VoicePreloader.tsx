'use client'

import { useEffect } from 'react'

/**
 * Precarga voces del navegador para evitar delay en /cotizar.
 * SpeechSynthesis.getVoices() es async la primera vez que se llama,
 * así que lo hacemos apenas carga el landing.
 */
export default function VoicePreloader() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    // Primera llamada (puede devolver [] inicialmente)
    window.speechSynthesis.getVoices()
    // Event handler que dispara cuando las voces están listas
    const handler = () => window.speechSynthesis.getVoices()
    window.speechSynthesis.addEventListener('voiceschanged', handler)
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handler)
    }
  }, [])
  return null
}
