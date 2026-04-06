import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import Services from '@/components/landing/Services'
import Gallery from '@/components/landing/Gallery'
import Testimonials from '@/components/landing/Testimonials'
import Contact from '@/components/landing/Contact'
import Footer from '@/components/landing/Footer'
import WhatsAppButton from '@/components/landing/WhatsAppButton'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 60

export default async function HomePage() {
  let categories = null
  let services = null
  let gallery = null
  let testimonials = null

  try {
    const supabase = await createClient()
    const [catRes, svcRes, galRes, testRes] = await Promise.all([
      supabase.from('categories').select('*').eq('active', true).order('sort_order'),
      supabase.from('services').select('*, category:categories(*)').eq('active', true).order('sort_order'),
      supabase.from('gallery').select('*').eq('active', true).order('sort_order'),
      supabase.from('testimonials').select('*').eq('active', true),
    ])
    categories = catRes.data
    services = svcRes.data
    gallery = galRes.data
    testimonials = testRes.data
  } catch {
    // Fallback to component defaults if Supabase unavailable
  }

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <div className="wave-separator" />
        <Services categories={categories ?? undefined} services={services ?? undefined} />
        <div className="wave-separator" />
        <Gallery items={gallery ?? undefined} />
        <Testimonials testimonials={testimonials ?? undefined} />
        <div className="wave-separator" />
        <Contact />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  )
}
