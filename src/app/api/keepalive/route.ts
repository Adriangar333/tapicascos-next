import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Cron diario (Vercel Hobby: 1/día en vercel.json).
 * Mantiene Supabase tibio con una query barata para que el primer hit del
 * día no pague el cold start del free tier.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('services').select('id').limit(1)
    if (error) throw error
    return NextResponse.json({ ok: true, ts: new Date().toISOString() })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'unknown' },
      { status: 500 },
    )
  }
}
