'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateQuoteStatus(formData: FormData) {
  const id = String(formData.get('id'))
  const status = String(formData.get('status'))
  const supabase = await createClient()
  await supabase.from('quotes').update({ status }).eq('id', id)
  revalidatePath('/admin/cotizaciones')
  revalidatePath('/admin')
}

export async function updateQuoteNotes(formData: FormData) {
  const id = String(formData.get('id'))
  const notes = String(formData.get('notes') ?? '')
  const supabase = await createClient()
  await supabase.from('quotes').update({ notes }).eq('id', id)
  revalidatePath('/admin/cotizaciones')
}
