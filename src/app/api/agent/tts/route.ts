import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Stub: ya no hacemos TTS server-side.
 *
 * Decisión: VibeVoice (y sus forks HF) no tiene voces en español — es un
 * modelo de podcast multi-speaker EN/ZH. Para Tapicascos Barranquilla
 * necesitamos voz en es-CO, así que la voz se hace 100% en el cliente
 * con `window.speechSynthesis` y `lang='es-CO'`.
 *
 * Este endpoint sobrevive como 204 para no romper llamadas existentes.
 * Si en el futuro integramos ElevenLabs o OpenAI TTS, aquí es donde va.
 */
export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { error: 'unavailable', fallback: 'browser', reason: 'server_tts_disabled' },
    { status: 200 },
  )
}

export async function GET() {
  return NextResponse.json({ warm: false, reason: 'server_tts_disabled' })
}
