import { NextRequest, NextResponse } from 'next/server'
import { synthesizeVibeVoice } from '@/lib/voice/vibevoice'
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
  if (!result) {
    return NextResponse.json(
      { error: 'unavailable', fallback: 'browser' },
      { status: 200 }
    )
  }

  return NextResponse.json({
    audio: `data:${result.mime};base64,${result.audioBase64}`,
    provider: 'vibevoice',
  })
}
