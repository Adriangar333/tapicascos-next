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
const PROVIDERS: Provider[] = [
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
  {
    name: 'xai',
    endpoint: 'https://api.x.ai/v1/chat/completions',
    model: 'grok-2-1212',
    getToken: () => process.env.XAI_API_KEY,
  },
  {
    name: 'vercel-gateway',
    endpoint: 'https://ai-gateway.vercel.sh/v1/chat/completions',
    model: 'groq/llama-3.3-70b-versatile',
    getToken: () => process.env.AI_GATEWAY_API_KEY ?? process.env.VERCEL_OIDC_TOKEN,
  },
]

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

    try {
      const t0 = Date.now()
      const res = await fetch(provider.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(25_000),
      })
      const dt = Date.now() - t0

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
