import { createClient } from '@/lib/supabase/server'
import LinkGenerator from '@/components/admin/LinkGenerator'

export const dynamic = 'force-dynamic'

export default async function CompartirPage() {
  const supabase = await createClient()
  const { data: services } = await supabase
    .from('services')
    .select('id, name, slug, image_url, price_min, price_max, description')
    .eq('active', true)
    .not('slug', 'is', null)
    .order('sort_order')

  return (
    <div className="p-8">
      <h1 className="text-3xl font-black mb-2">Generador de links</h1>
      <p className="text-gray-400 mb-8">
        Crea links únicos por servicio y canal (Instagram, Facebook, WhatsApp, etc). Cada link
        queda trackeado en las cotizaciones, así sabes de dónde vinieron tus clientes.
      </p>

      <LinkGenerator services={services ?? []} />
    </div>
  )
}
