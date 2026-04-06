import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import Services from '@/components/landing/Services'
import Gallery from '@/components/landing/Gallery'
import Testimonials from '@/components/landing/Testimonials'
import Contact from '@/components/landing/Contact'
import Footer from '@/components/landing/Footer'
import WhatsAppButton from '@/components/landing/WhatsAppButton'
// import { createClient } from '@/lib/supabase/server'

export const revalidate = 60

export default async function HomePage() {
  // TODO: Fetch from Supabase when schema is ready
  // const supabase = await createClient()
  // const { data: categories } = await supabase.from('categories').select('*').eq('active', true).order('sort_order')
  // const { data: services } = await supabase.from('services').select('*, category:categories(*)').eq('active', true).order('sort_order')
  // const { data: gallery } = await supabase.from('gallery').select('*').eq('active', true).order('sort_order')
  // const { data: testimonials } = await supabase.from('testimonials').select('*').eq('active', true)

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <div className="wave-separator" />
        <Services />
        <div className="wave-separator" />
        <Gallery />
        <Testimonials />
        <div className="wave-separator" />
        <Contact />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  )
}
