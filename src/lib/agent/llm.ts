/**
 * Cliente LLM multi-proveedor con fallback nativo.
 *
 * Aprovecha las INTEGRACIONES de Vercel que ya están instaladas en el proyecto:
 *  - Groq Marketplace integration → inyecta GROQ_API_KEY automáticamente
 *  - xAI Marketplace integration   → inyecta XAI_API_KEY automáticamente
 *  - AI Gateway (opcional)         → AI_GATEWAY_API_KEY o VERCEL_OIDC_TOKEN
 *
 * Todos los proveedores exponen una API OpenAI-compatible, así que el tool loop
 * funciona idéntico. Si el primero falla (429/5xx/timeout), salta al siguiente.
 */

export type OpenAIMessage =
  | { role: 'system'; content: string }
  | { role: 'user'; content: string }
  | {
      role: 'assistant'
      content: string | null
      tool_calls?: Array<{
        id: string
        type: 'function'
        function: { name: string; arguments: string }
      }>
    }
  | { role: 'tool'; tool_call_id: string; content: string }

export type ChatCompletionResponse = {
  id?: string
  model?: string
  choices: Array<{
    finish_reason: string
    message: {
      role: 'assistant'
      content: string | null
      tool_calls?: Array<{
        id: string
        type: 'function'
        function: { name: string; arguments: string }
      }>
    }
  }>
  error?: { message: string; code?: number }
}

type Provider = {
  name: string
  endpoint: string
  model: string
  getToken: () => string | undefined
  extraHeaders?: Record<string, string>
}

// Orden de intentos (primero el mejor para tool use + más rápido)
// Cualquiera de estas env vars basta para que el agente funcione.
const PROVIDERS: Provider[] = [
  // --- Groq: free tier, ~1000 tok/s, tool use sólido (RECOMENDADO) ---
  {
    name: 'groq',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
    getToken: () => process.env.GROQ_API_KEY,
  },
  {
    name: 'groq-fallback',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.1-8b-instant',
    getToken: () => process.env.GROQ_API_KEY,
  },
  // --- Google Gemini: free tier generoso, OpenAI-compatible endpoint ---
  {
    name: 'gemini',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    model: 'gemini-2.0-flash',
    getToken: () => process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY,
  },
  // --- OpenRouter: cualquier modelo :free funciona ---
  {
    name: 'openrouter',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    getToken: () => process.env.OPENROUTER_API_KEY,
    extraHeaders: {
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tapicascos.vercel.app',
      'X-Title': 'Tapicascos Barranquilla',
    },
  },
  {
    name: 'openrouter-deepseek',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'deepseek/deepseek-chat-v3.1:free',
    getToken: () => process.env.OPENROUTER_API_KEY,
    extraHeaders: {
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tapicascos.vercel.app',
      'X-Title': 'Tapicascos Barranquilla',
    },
  },
  // --- xAI: opcional si tienes la integración ---
  {
    name: 'xai',
    endpoint: 'https://api.x.ai/v1/chat/completions',
    model: 'grok-2-1212',
    getToken: () => process.env.XAI_API_KEY,
  },
  // --- Vercel AI Gateway: opcional ---
  {
    name: 'vercel-gateway',
    endpoint: 'https://ai-gateway.vercel.sh/v1/chat/completions',
    model: 'groq/llama-3.3-70b-versatile',
    getToken: () => process.env.AI_GATEWAY_API_KEY ?? process.env.VERCEL_OIDC_TOKEN,
  },
]

/**
 * Vision: describe una imagen por URL en español usando un modelo multimodal.
 * Intenta Groq llama-4-scout (gratis, soporta image_url) y cae a OpenRouter gemini flash free.
 * Devuelve null si ningún proveedor responde — el caller debe tolerarlo.
 */
export type VisionAttempt = { provider: string; ok: boolean; status?: number; error?: string }
export type VisionResult = { text: string | null; attempts: VisionAttempt[] }

async function fetchImageAsDataUrl(url: string): Promise<{ dataUrl: string | null; error?: string }> {
  try {
    const res = await fetch(url, {
      headers: {
        // UA legítimo para evitar 403 en wikipedia/cdns
        'User-Agent': 'Mozilla/5.0 (compatible; TapicascosBot/1.0; +https://tapicascos.vercel.app)',
        Accept: 'image/*,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(12_000),
    })
    if (!res.ok) return { dataUrl: null, error: `fetch_${res.status}` }
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.byteLength > 5 * 1024 * 1024) return { dataUrl: null, error: 'too_large' }
    const ct = res.headers.get('content-type') || 'image/jpeg'
    return { dataUrl: `data:${ct};base64,${buf.toString('base64')}` }
  } catch (e) {
    return { dataUrl: null, error: e instanceof Error ? e.message : 'fetch_error' }
  }
}

export async function describeHelmetImage(imageUrl: string): Promise<VisionResult> {
  const attempts: VisionAttempt[] = []
  // Pre-fetch a base64 para no depender de que cada provider pueda traer la URL
  const { dataUrl, error: fetchErr } = await fetchImageAsDataUrl(imageUrl)
  if (!dataUrl) {
    attempts.push({ provider: 'prefetch', ok: false, error: fetchErr ?? 'unknown' })
    return { text: null, attempts }
  }
  const inlineUrl = dataUrl
  const visionProviders: Array<{
    name: string
    endpoint: string
    model: string
    token?: string
    extraHeaders?: Record<string, string>
  }> = [
    {
      name: 'groq-vision-scout',
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      token: process.env.GROQ_API_KEY,
    },
    {
      name: 'gemini-vision',
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      model: 'gemini-2.0-flash',
      token: process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY,
    },
    {
      name: 'openrouter-qwen-vl',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      model: 'qwen/qwen2.5-vl-72b-instruct:free',
      token: process.env.OPENROUTER_API_KEY,
      extraHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tapicascos.vercel.app',
        'X-Title': 'Tapicascos Barranquilla',
      },
    },
  ]

  const prompt =
    'Mira esta foto de un casco de moto y descríbela en 1-2 oraciones en español, centrándote SOLO en lo que se ve: tipo de casco (integral/abierto/modular), color principal, estado visible del interior si se aprecia (limpio, desgastado, roto), y cualquier daño externo evidente (rayones, golpes, pintura dañada). No inventes detalles. No uses viñetas. No digas "en la imagen" ni "la foto". Si no puedes ver bien el casco, di exactamente: "casco de moto, no se aprecia suficiente detalle".'

  for (const p of visionProviders) {
    if (!p.token) {
      attempts.push({ provider: p.name, ok: false, error: 'no_token' })
      continue
    }
    try {
      const res = await fetch(p.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${p.token}`,
          ...(p.extraHeaders ?? {}),
        },
        body: JSON.stringify({
          model: p.model,
          temperature: 0.2,
          max_tokens: 160,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: inlineUrl } },
              ],
            },
          ],
        }),
        signal: AbortSignal.timeout(20_000),
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        const snippet = txt.slice(0, 200)
        console.warn(`[vision] ${p.name} HTTP ${res.status}: ${snippet}`)
        attempts.push({ provider: p.name, ok: false, status: res.status, error: snippet })
        continue
      }
      const json = (await res.json()) as ChatCompletionResponse
      const txt = json.choices?.[0]?.message?.content?.toString().trim()
      if (txt) {
        console.log(`[vision] ✓ ${p.name}`)
        attempts.push({ provider: p.name, ok: true })
        return { text: txt, attempts }
      }
      attempts.push({ provider: p.name, ok: false, error: 'empty_choices' })
    } catch (err) {
      const m = err instanceof Error ? err.message : String(err)
      console.warn(`[vision] ${p.name} error:`, m)
      attempts.push({ provider: p.name, ok: false, error: m.slice(0, 200) })
    }
  }
  return { text: null, attempts }
}

export function getAvailableProviders(): string[] {
  return PROVIDERS.filter((p) => !!p.getToken()).map((p) => `${p.name}:${p.model}`)
}

export function isLlmConfigured(): boolean {
  return PROVIDERS.some((p) => !!p.getToken())
}

// Alias legacy para no romper imports existentes
export const isGatewayConfigured = isLlmConfigured

type CallArgs = {
  messages: OpenAIMessage[]
  tools: unknown[]
  temperature?: number
  maxTokens?: number
}

export async function callOpenRouter({
  messages,
  tools,
  temperature = 0.4,
  maxTokens = 1024,
}: CallArgs): Promise<{ response: ChatCompletionResponse; modelUsed: string }> {
  const available = PROVIDERS.filter((p) => !!p.getToken())
  console.log(
    '[llm] providers available:',
    available.map((p) => p.name).join(', ') || 'NONE'
  )

  if (available.length === 0) {
    throw new Error(
      'Ningún proveedor LLM configurado. Falta GROQ_API_KEY, XAI_API_KEY o AI_GATEWAY_API_KEY.'
    )
  }

  let lastErr: unknown = null

  for (const provider of available) {
    const token = provider.getToken()!
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(provider.extraHeaders ?? {}),
    }

    const body: Record<string, unknown> = {
      model: provider.model,
      messages,
      tools,
      tool_choice: 'auto',
      temperature,
      max_tokens: maxTokens,
    }

    // Retry inline en 429/5xx con backoff lineal, antes de pasar al siguiente provider.
    // Muchos fallos de Groq free tier son picos cortos que se resuelven en 1s.
    let res: Response | null = null
    let dt = 0
    let attemptErr: Error | null = null
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const t0 = Date.now()
        res = await fetch(provider.endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(25_000),
        })
        dt = Date.now() - t0
        if (res.ok) break
        if (res.status !== 429 && res.status < 500) break
        const backoff = 600 * (attempt + 1)
        console.warn(`[llm] ${provider.name} HTTP ${res.status}, retry en ${backoff}ms`)
        await new Promise((r) => setTimeout(r, backoff))
      } catch (e) {
        attemptErr = e instanceof Error ? e : new Error(String(e))
        if (attempt === 0) await new Promise((r) => setTimeout(r, 600))
      }
    }

    try {
      if (!res) throw attemptErr ?? new Error(`[${provider.name}] no response`)
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        lastErr = new Error(
          `[${provider.name}] HTTP ${res.status} (${dt}ms): ${text.slice(0, 200)}`
        )
        console.warn('[llm] fallback →', String(lastErr))
        continue
      }

      const json = (await res.json()) as ChatCompletionResponse
      if (json.error || !json.choices?.length) {
        lastErr = new Error(
          `[${provider.name}] upstream error: ${json.error?.message ?? 'no choices'}`
        )
        console.warn('[llm] fallback →', String(lastErr))
        continue
      }

      console.log(`[llm] ✓ ${provider.name} ${provider.model} (${dt}ms)`)
      return { response: json, modelUsed: `${provider.name}/${provider.model}` }
    } catch (err) {
      lastErr = err
      console.warn(
        '[llm] fallback →',
        provider.name,
        err instanceof Error ? err.message : String(err)
      )
      continue
    }
  }

  throw new Error(
    `Todos los proveedores fallaron. Último error: ${
      lastErr instanceof Error ? lastErr.message : String(lastErr)
    }`
  )
}
