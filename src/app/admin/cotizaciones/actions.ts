'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const ALLOWED_STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost'] as const
type QuoteStatus = (typeof ALLOWED_STATUSES)[number]

export async function updateQuoteStatus(formData: FormData) {
  const id = String(formData.get('id') ?? '').trim()
  const status = String(formData.get('status') ?? '').trim()
  if (!id || !ALLOWED_STATUSES.includes(status as QuoteStatus)) {
    console.error('[updateQuoteStatus] invalid input', { id, status })
    return
  }
  const supabase = await createClient()
  const { error } = await supabase.from('quotes').update({ status }).eq('id', id)
  if (error) {
    console.error('[updateQuoteStatus] supabase error', error)
    return
  }
  revalidatePath('/admin/cotizaciones')
  revalidatePath('/admin')
}

export async function updateQuoteNotes(formData: FormData) {
  const id = String(formData.get('id') ?? '').trim()
  const notes = String(formData.get('notes') ?? '')
  if (!id) {
    console.error('[updateQuoteNotes] missing id')
    return
  }
  const supabase = await createClient()
  const { error } = await supabase.from('quotes').update({ notes }).eq('id', id)
  if (error) {
    console.error('[updateQuoteNotes] supabase error', error)
    return
  }
  revalidatePath('/admin/cotizaciones')
}
