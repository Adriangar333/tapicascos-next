import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { warmVibeVoice } from '@/lib/voice/vibevoice'

export const dynamic = 'force-dynamic'

/**
 * Cron diario (Vercel Hobby: 1/día en vercel.json).
 * 1) Mantiene Supabase tibio con una query barata.
 * 2) Despierta el Space de VibeVoice en HuggingFace.
 */
export async function GET() {
  const ts = new Date().toISOString()
  let supabaseOk = false
  let supabaseError: string | null = null

  try {
    const supabase = await createClient()
    const { error } = await supabase.from('services').select('id').limit(1)
    if (error) throw error
    supabaseOk = true
  } catch (e) {
    supabaseError = e instanceof Error ? e.message : 'unknown'
  }

  const voice = await warmVibeVoice()

  return NextResponse.json({
    ok: supabaseOk,
    ts,
    supabase: { ok: supabaseOk, error: supabaseError },
    voice,
  })
}
