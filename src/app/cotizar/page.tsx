import Link from 'next/link'
import { submitQuote } from './actions'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Cotiza tu casco | Tapicascos Barranquilla',
  description: 'Cuéntanos qué necesitas y te enviamos una cotización personalizada sin llamadas.',
}

// Map service category/name to dropdown value
function inferServiceType(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('silla')) return 'silla_moto'
  if (n.includes('pintura')) return 'pintura_personalizada'
  if (n.includes('ajuste')) return 'ajuste_talla'
  if (n.includes('parcial')) return 'tapizado_parcial'
  if (n.includes('integral') || n.includes('original')) return 'tapizado_integral'
  if (n.includes('accesor') || n.includes('repuesto')) return 'accesorios'
  return 'otro'
}

export default async function CotizarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; servicio?: string; utm_source?: string }>
}) {
  const { error, servicio, utm_source } = await searchParams

  let selectedService: { name: string; slug: string } | null = null
  let defaultServiceType = ''

  if (servicio) {
    try {
      const supabase = await createClient()
      const { data } = await supabase
        .from('services')
        .select('name, slug')
        .eq('slug', servicio)
        .maybeSingle()
      if (data) {
        selectedService = data
        defaultServiceType = inferServiceType(data.name)
      }
    } catch {}
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0A0E1A] via-[#0F1428] to-[#0A0E1A] text-white py-16 px-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-sm text-gray-400 hover:text-white">← Volver al inicio</Link>

        <h1 className="text-4xl md:text-5xl font-black mt-6 mb-3">
          Cotiza tu <span className="gradient-text">casco</span>
        </h1>
        <p className="text-gray-400 mb-8">
          Cuéntanos qué quieres hacerle a tu casco. Te respondemos con una cotización
          personalizada — sin llamadas, directo a tu WhatsApp.
        </p>

        {selectedService && (
          <div className="mb-6 p-4 rounded-xl border border-[#FF6B35]/30 bg-[#FF6B35]/10">
            <p className="text-sm text-gray-300">Estás cotizando:</p>
            <p className="text-lg font-bold text-[#FF6B35]">{selectedService.name}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 text-sm">
            {error === 'missing'
              ? 'Faltan campos obligatorios. Revisa el formulario.'
              : 'Ocurrió un error guardando tu solicitud. Intenta de nuevo.'}
          </div>
        )}

        <form action={submitQuote} className="space-y-5">
          {/* Hidden tracking fields */}
          <input type="hidden" name="source" value={utm_source ?? ''} />
          <input type="hidden" name="service_slug" value={selectedService?.slug ?? ''} />

          <div className="grid md:grid-cols-2 gap-5">
            <Field label="Nombre completo *" name="name" required />
            <Field label="WhatsApp *" name="phone" type="tel" placeholder="300 123 4567" required />
          </div>

          <Field label="Email (opcional)" name="email" type="email" />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              ¿Qué servicio necesitas? *
            </label>
            <select
              name="service_type"
              required
              defaultValue={defaultServiceType}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#FF6B35] focus:outline-none"
            >
              <option value="" disabled>Selecciona un servicio</option>
              <option value="tapizado_integral">Tapizado integral</option>
              <option value="tapizado_parcial">Tapizado parcial</option>
              <option value="pintura_personalizada">Pintura personalizada</option>
              <option value="ajuste_talla">Ajuste de talla</option>
              <option value="silla_moto">Tapizado de silla de moto</option>
              <option value="accesorios">Accesorios o repuestos</option>
              <option value="otro">Otro / no estoy seguro</option>
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <Field label="Marca del casco" name="helmet_brand" placeholder="Shaft, AGV, HJC..." />
            <Field label="Modelo" name="helmet_model" placeholder="Ej: 551" />
          </div>

          <Field
            label="Colores o estilo que quieres"
            name="color_preference"
            placeholder="Ej: negro con rojo, estilo racing, cuero café..."
          />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Cuéntanos qué quieres hacer *
            </label>
            <textarea
              name="description"
              required
              rows={5}
              placeholder="Describe el trabajo con el mayor detalle posible. Si tienes una foto de referencia, menciónalo y te la pediremos por WhatsApp."
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#FF6B35] focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Presupuesto estimado (opcional)
            </label>
            <select
              name="budget_range"
              defaultValue=""
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#FF6B35] focus:outline-none"
            >
              <option value="">Prefiero que me coticen</option>
              <option value="0-50k">Menos de $50.000</option>
              <option value="50-100k">$50.000 - $100.000</option>
              <option value="100-200k">$100.000 - $200.000</option>
              <option value="200k+">Más de $200.000</option>
            </select>
          </div>

          <button type="submit" className="btn-primary w-full text-lg py-4">
            Enviar solicitud de cotización
          </button>

          <p className="text-xs text-gray-500 text-center">
            Al enviar aceptas que te contactemos por WhatsApp al número indicado.
          </p>
        </form>
      </div>
    </main>
  )
}

function Field({
  label,
  name,
  type = 'text',
  placeholder,
  required,
}: {
  label: string
  name: string
  type?: string
  placeholder?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#FF6B35] focus:outline-none"
      />
    </div>
  )
}
