import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const quoteId = req.nextUrl.searchParams.get('quote_id')
  if (!quoteId) return NextResponse.json({ error: 'Missing quote_id' }, { status: 400 })

  const supabase = await createClient()

  // Bloquea no autenticados
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('ai_conversations')
    .select('messages, turn_count, created_at, updated_at')
    .eq('quote_id', quoteId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ messages: [] })

  return NextResponse.json(data)
}
