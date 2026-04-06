'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function submitQuote(formData: FormData) {
  const payload = {
    name: String(formData.get('name') ?? '').trim(),
    phone: String(formData.get('phone') ?? '').trim(),
    email: String(formData.get('email') ?? '').trim() || null,
    service_type: String(formData.get('service_type') ?? '').trim(),
    helmet_brand: String(formData.get('helmet_brand') ?? '').trim() || null,
    helmet_model: String(formData.get('helmet_model') ?? '').trim() || null,
    color_preference: String(formData.get('color_preference') ?? '').trim() || null,
    description: String(formData.get('description') ?? '').trim(),
    budget_range: String(formData.get('budget_range') ?? '').trim() || null,
  }

  if (!payload.name || !payload.phone || !payload.service_type || !payload.description) {
    redirect('/cotizar?error=missing')
  }

  const supabase = await createClient()
  const { error } = await supabase.from('quotes').insert(payload)

  if (error) {
    console.error('quote insert error', error)
    redirect('/cotizar?error=db')
  }

  redirect('/cotizar/gracias')
}
