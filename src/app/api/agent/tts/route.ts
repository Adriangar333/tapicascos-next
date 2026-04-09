import { NextRequest, NextResponse } from 'next/server'
import { synthesizeVibeVoice, getVibeVoiceSpace } from '@/lib/voice/vibevoice'
import { checkRateLimit } from '@/lib/agent/rateLimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_CHARS = 600

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(`tts:${ip}`)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  let body: { text?: string; voice?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const rawText = (body.text ?? '').trim()
  if (!rawText) return NextResponse.json({ error: 'empty' }, { status: 400 })

  // Limpia markdown y limita largo
  const text = rawText
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/[🪖💬📎🔧✅😕🙂🎨]/gu, '')
    .slice(0, MAX_CHARS)

  const result = await synthesizeVibeVoice(text, { voice: body.voice })
  if (!result.ok) {
    console.warn('[tts] vibevoice unavailable:', result.reason, result.space, result.status ?? '')
    return NextResponse.json(
      {
        error: 'unavailable',
        fallback: 'browser',
        reason: result.reason,
        space: result.space,
        status: result.status,
      },
      { status: 200 },
    )
  }

  return NextResponse.json({
    audio: `data:${result.mime};base64,${result.audioBase64}`,
    provider: 'vibevoice',
    space: result.space,
  })
}

// Warmup endpoint: despierta el Space sin sintetizar nada.
// Se llama desde el cron diario y desde el cliente al abrir el chat.
export async function GET() {
  const { warmVibeVoice } = await import('@/lib/voice/vibevoice')
  const result = await warmVibeVoice()
  return NextResponse.json({
    space: getVibeVoiceSpace(),
    warm: result.ok,
    status: result.status,
  })
}
