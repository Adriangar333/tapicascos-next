'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createBeforeAfter(formData: FormData) {
  const supabase = await createClient()
  await supabase.from('before_after').insert({
    title: String(formData.get('title') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim() || null,
    before_url: String(formData.get('before_url') ?? '').trim(),
    after_url: String(formData.get('after_url') ?? '').trim(),
    sort_order: Number(formData.get('sort_order') ?? 0),
    active: formData.get('active') === 'on',
  })
  revalidatePath('/admin/antes-despues')
  revalidatePath('/')
}

export async function deleteBeforeAfter(formData: FormData) {
  const id = String(formData.get('id'))
  const supabase = await createClient()
  await supabase.from('before_after').delete().eq('id', id)
  revalidatePath('/admin/antes-despues')
  revalidatePath('/')
}

export async function toggleBeforeAfter(formData: FormData) {
  const id = String(formData.get('id'))
  const active = formData.get('active') === 'true'
  const supabase = await createClient()
  await supabase.from('before_after').update({ active: !active }).eq('id', id)
  revalidatePath('/admin/antes-despues')
  revalidatePath('/')
}
