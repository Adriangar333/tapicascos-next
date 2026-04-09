import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import ShareButtons from '@/components/landing/ShareButtons'

export const revalidate = 300

const SITE_URL = 'https://tapicascos-next.vercel.app'

function formatPrice(min: number, max: number | null): string {
  const fmt = (n: number) => '$' + n.toLocaleString('es-CO')
  if (!max || max === min) return `Desde ${fmt(min)}`
  return `${fmt(min)} — ${fmt(max)}`
}

async function getService(slug: string) {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('services')
      .select('*, category:categories(*)')
      .eq('slug', slug)
      .eq('active', true)
      .maybeSingle()
    return data
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const service = await getService(slug)

  if (!service) {
    return { title: 'Servicio no encontrado | Tapicascos' }
  }

  const title = `${service.name} | Tapicascos Barranquilla`
  const description =
    service.long_description ||
    service.description ||
    `${service.name} — ${formatPrice(service.price_min, service.price_max)}. Cotiza fácil y rápido en Tapicascos Barranquilla.`
  const url = `${SITE_URL}/servicios/${slug}`
  const image = service.image_url || `${SITE_URL}/og-default.jpg`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'Tapicascos Barranquilla',
      images: [{ url: image, width: 1200, height: 630, alt: service.name }],
      locale: 'es_CO',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    alternates: { canonical: url },
  }
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const service = await getService(slug)
  if (!service) notFound()

  const shareUrl = `${SITE_URL}/servicios/${slug}`
  const shareText = `${service.name} en Tapicascos Barranquilla — ${formatPrice(service.price_min, service.price_max)}`

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-[#0A0E1A] via-[#0F1428] to-[#0A0E1A] text-white pt-24 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <Link href="/#servicios" className="text-sm text-gray-400 hover:text-white">
            ← Volver a servicios
          </Link>

          <div className="grid md:grid-cols-2 gap-10 mt-6">
            {/* Image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-white/5">
              {service.image_url ? (
                <Image
                  src={service.image_url}
                  alt={service.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">
                  Sin imagen
                </div>
              )}
            </div>

            {/* Content */}
            <div>
              {service.category?.name && (
                <span className="text-xs uppercase tracking-widest text-[#FF6B35] font-semibold">
                  {service.category.name}
                </span>
              )}
              <h1 className="text-4xl md:text-5xl font-black mt-2 mb-4">{service.name}</h1>
              <p className="text-3xl font-bold text-[#FF6B35] mb-6">
                {formatPrice(service.price_min, service.price_max)}
              </p>
              <p className="text-gray-300 text-lg leading-relaxed mb-8">
                {service.long_description || service.description}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <a
                  href={`/cotizar?servicio=${slug}`}
                  className="btn-primary text-lg px-8 py-4 text-center"
                >
                  Cotizar este servicio
                </a>
                <a
                  href={`https://wa.me/573003199232?text=${encodeURIComponent(`Hola, me interesa ${service.name}`)}`}
                  target="_blank"
                  className="px-8 py-4 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/5 transition-all text-lg text-center"
                >
                  Preguntar por WhatsApp
                </a>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">Compartir este servicio:</p>
                <ShareButtons url={shareUrl} text={shareText} />
              </div>
            </div>
          </div>

          {/* Gallery of extra images if available */}
          {service.gallery_urls && service.gallery_urls.length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl font-bold mb-6">Más fotos de este trabajo</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {service.gallery_urls.map((url: string, i: number) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                    <Image src={url} alt={`${service.name} ${i + 1}`} fill className="object-cover" sizes="33vw" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
