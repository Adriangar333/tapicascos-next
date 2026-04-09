/**
 * Cliente Vercel AI Gateway (OpenAI-compatible).
 *
 * Ventajas vs OpenRouter:
 *  - Billing unificado con Vercel (Groq + xAI ya conectados via integration)
 *  - Zero-config en producción: usa VERCEL_OIDC_TOKEN automáticamente
 *  - Fallback nativo entre modelos via providerOptions.gateway.models
 *  - Misma API OpenAI-compatible → tool_calls funcionan igual
 *
 * Auth priority:
 *   1. AI_GATEWAY_API_KEY   (local dev, override manual)
 *   2. VERCEL_OIDC_TOKEN    (auto-inyectado en deploys de Vercel)
 */

// Modelo primario + cadena de fallback (todos con tool use)
// Orden: Groq Llama 3.3 70B (rápido + tool use sólido)
//        → xAI Grok 4.1 fast (buen respaldo)
//        → Groq Llama 3.1 8B instant (último recurso, muy rápido)
export const PRIMARY_MODEL = 'groq/llama-3.3-70b-versatile'
export const FALLBACK_MODELS = [
  'groq/llama-3.3-70b-versatile',
  'xai/grok-4.1-fast-non-reasoning',
  'groq/llama-3.1-8b-instant',
] as const

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

type CallArgs = {
  messages: OpenAIMessage[]
  tools: unknown[]
  temperature?: number
  maxTokens?: number
}

const ENDPOINT = 'https://ai-gateway.vercel.sh/v1/chat/completions'

function getAuthToken(): string | null {
  return process.env.AI_GATEWAY_API_KEY ?? process.env.VERCEL_OIDC_TOKEN ?? null
}

export function isGatewayConfigured(): boolean {
  return getAuthToken() !== null
}

export async function callOpenRouter({
  messages,
  tools,
  temperature = 0.4,
  maxTokens = 1024,
}: CallArgs): Promise<{ response: ChatCompletionResponse; modelUsed: string }> {
  const token = getAuthToken()
  if (!token) {
    throw new Error(
      'AI Gateway no configurado. Define AI_GATEWAY_API_KEY en local o deploy en Vercel para OIDC automático.'
    )
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }

  // Gateway soporta fallback nativo: el primer modelo es el primario,
  // el resto en providerOptions.gateway.models como respaldo.
  const body = {
    model: PRIMARY_MODEL,
    messages,
    tools,
    tool_choice: 'auto' as const,
    temperature,
    max_tokens: maxTokens,
    providerOptions: {
      gateway: {
        models: FALLBACK_MODELS,
      },
    },
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(25_000),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`[ai-gateway] HTTP ${res.status}: ${text.slice(0, 300)}`)
    }

    const json = (await res.json()) as ChatCompletionResponse

    if (json.error || !json.choices?.length) {
      throw new Error(`[ai-gateway] upstream error: ${json.error?.message ?? 'no choices'}`)
    }

    return { response: json, modelUsed: json.model ?? PRIMARY_MODEL }
  } catch (err) {
    console.error(
      '[llm] gateway failed:',
      err instanceof Error ? err.message : String(err)
    )
    throw err
  }
}
