import { createClient } from '@/lib/supabase/server'

// ---------- Tool definitions (formato OpenAI / OpenRouter) ----------

export type OpenAITool = {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

export const TOOLS: OpenAITool[] = [
  {
    type: 'function',
    function: {
      name: 'get_services',
      description:
        'Consulta los servicios y precios REALES de Tapicascos en la base de datos. Llama esta herramienta SIEMPRE antes de mencionar cualquier precio al cliente. Puedes filtrar por categoría opcional: "tapizado", "pintura", "silla", o dejarla vacía para traer todos.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Filtro opcional: "tapizado", "pintura", "silla". Vacío = todos.',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_accessories',
      description:
        'Consulta los accesorios REALES (tornillería, visores, espuma, forros, herrajes) que vende el taller con sus precios. Llama esta herramienta cuando el cliente pregunte por repuestos, visores, tornillos, almohadillas, espuma o accesorios específicos. Puedes filtrar por categoría opcional.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description:
              'Filtro opcional: "tornillería", "visores", "espuma", "forros", "herrajes", "otros". Vacío = todos.',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'save_lead',
      description:
        'Guarda el lead en la base de datos de Tapicascos. Llamar SOLO cuando ya tengas: nombre, teléfono (WhatsApp), tipo de servicio y al menos una descripción básica de lo que quiere. Devuelve el quote_id para handoff posterior.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Nombre completo del cliente' },
          phone: {
            type: 'string',
            description: 'Número WhatsApp, solo dígitos o con espacios (se normaliza)',
          },
          service_type: {
            type: 'string',
            enum: [
              'tapizado_integral',
              'tapizado_parcial',
              'pintura_personalizada',
              'ajuste_talla',
              'silla_moto',
              'accesorios',
              'otro',
            ],
          },
          helmet_brand: { type: 'string', description: 'Marca del casco (opcional)' },
          helmet_model: { type: 'string', description: 'Modelo del casco (opcional)' },
          description: {
            type: 'string',
            description: 'Resumen de lo que quiere el cliente en 1-2 oraciones',
          },
        },
        required: ['name', 'phone', 'service_type', 'description'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_whatsapp_link',
      description:
        'Genera el link de WhatsApp con un resumen prellenado del lead ya guardado. Llamar al final del flujo, justo después de save_lead, para que el cliente pueda continuar por WhatsApp con contexto.',
      parameters: {
        type: 'object',
        properties: {
          quote_id: { type: 'string', description: 'ID devuelto por save_lead' },
        },
        required: ['quote_id'],
      },
    },
  },
]

// ---------- Tool handlers (lo que se ejecuta server-side) ----------

export function formatPrice(min: number, max: number | null): string {
  const fmt = (n: number) => '$' + n.toLocaleString('es-CO')
  if (!max || max === min) return `desde ${fmt(min)}`
  return `${fmt(min)} – ${fmt(max)}`
}

export function sanitizePhone(raw: string): string {
  return raw.replace(/\D/g, '')
}

export function isValidPhone(phone: string): boolean {
  const digits = sanitizePhone(phone)
  return digits.length >= 10 && digits.length <= 13
}

export async function runTool(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  const supabase = await createClient()
  const args: Record<string, unknown> = input && typeof input === 'object' ? input : {}

  if (name === 'get_services') {
    const categoryHint = ((args.category as string) || '').toLowerCase()
    const { data, error } = await supabase
      .from('services')
      .select('name, slug, description, price_min, price_max, category:categories(slug, name)')
      .eq('active', true)
      .order('sort_order', { ascending: true })

    if (error) return JSON.stringify({ error: error.message })

    const filtered = (data ?? []).filter((s) => {
      if (!categoryHint) return true
      const catSlug = (s.category as unknown as { slug?: string } | null)?.slug ?? ''
      return catSlug.includes(categoryHint) || s.name.toLowerCase().includes(categoryHint)
    })

    const services = filtered.map((s) => ({
      name: s.name,
      slug: s.slug,
      category: (s.category as unknown as { name?: string } | null)?.name ?? null,
      description: s.description,
      price: formatPrice(s.price_min, s.price_max),
      price_min_cop: s.price_min,
      price_max_cop: s.price_max,
    }))

    return JSON.stringify({ services, count: services.length })
  }

  if (name === 'get_accessories') {
    const categoryHint = ((args.category as string) || '').toLowerCase()
    const { data, error } = await supabase
      .from('accessories')
      .select('name, price, category')
      .eq('active', true)
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true })

    if (error) return JSON.stringify({ error: error.message })

    const filtered = (data ?? []).filter((a) => {
      if (!categoryHint) return true
      return (
        a.category.toLowerCase().includes(categoryHint) ||
        a.name.toLowerCase().includes(categoryHint)
      )
    })

    const accessories = filtered.map((a) => ({
      name: a.name,
      category: a.category,
      price_cop: a.price,
      price: '$' + a.price.toLocaleString('es-CO'),
    }))

    return JSON.stringify({ accessories, count: accessories.length })
  }

  if (name === 'save_lead') {
    const { name: clientName, phone, service_type, helmet_brand, helmet_model, description } =
      args as {
        name: string
        phone: string
        service_type: string
        helmet_brand?: string
        helmet_model?: string
        description: string
      }

    if (!isValidPhone(phone)) {
      return JSON.stringify({
        error: 'Teléfono inválido. Pide al cliente que lo repita con al menos 10 dígitos.',
      })
    }

    const clean = sanitizePhone(phone)

    const { data, error } = await supabase
      .from('quotes')
      .insert({
        name: clientName.trim(),
        phone: clean,
        service_type,
        helmet_brand: helmet_brand?.trim() || null,
        helmet_model: helmet_model?.trim() || null,
        description: description.trim(),
        status: 'new',
        source: 'agente_ia',
      })
      .select('id')
      .single()

    if (error || !data) {
      return JSON.stringify({ error: error?.message || 'No se pudo guardar el lead' })
    }

    return JSON.stringify({
      success: true,
      quote_id: data.id,
      message: `Lead guardado exitosamente. quote_id=${data.id}`,
    })
  }

  if (name === 'get_whatsapp_link') {
    const quote_id = args.quote_id as string
    const { data, error } = await supabase
      .from('quotes')
      .select('name, phone, service_type, description, helmet_brand, helmet_model')
      .eq('id', quote_id)
      .single()

    if (error || !data) return JSON.stringify({ error: 'Quote no encontrado' })

    const shopPhone = process.env.NEXT_PUBLIC_SHOP_WHATSAPP ?? '573001234567'
    const helmet = [data.helmet_brand, data.helmet_model].filter(Boolean).join(' ') || 'su casco'
    const msg =
      `Hola, soy ${data.name}. Acabo de hablar con Tapi en la web sobre ${helmet}. ` +
      `Quiero seguir con la cotización: ${data.description}`
    const link = `https://wa.me/${shopPhone}?text=${encodeURIComponent(msg)}`

    return JSON.stringify({ whatsapp_link: link })
  }

  return JSON.stringify({ error: `Tool desconocida: ${name}` })
}
