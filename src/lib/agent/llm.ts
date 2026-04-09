/**
 * OpenRouter client con cadena de fallback entre modelos gratuitos.
 * API OpenAI-compatible: POST https://openrouter.ai/api/v1/chat/completions
 *
 * Si un modelo devuelve error (429, 5xx, timeout, campo `error` en body),
 * pasa automáticamente al siguiente de la cadena.
 */

export const FREE_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemini-2.0-flash-exp:free',
  'qwen/qwen-2.5-72b-instruct:free',
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

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions'

export async function callOpenRouter({
  messages,
  tools,
  temperature = 0.4,
  maxTokens = 1024,
}: CallArgs): Promise<{ response: ChatCompletionResponse; modelUsed: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY no configurada')

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
    'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tapicascos.vercel.app',
    'X-Title': 'Tapicascos Barranquilla',
  }

  let lastErr: unknown = null

  for (const model of FREE_MODELS) {
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages,
          tools,
          tool_choice: 'auto',
          temperature,
          max_tokens: maxTokens,
        }),
        // 25s timeout (Vercel serverless límite: ~60s)
        signal: AbortSignal.timeout(25_000),
      })

      if (!res.ok) {
        lastErr = new Error(`[${model}] HTTP ${res.status}: ${await res.text().catch(() => '')}`)
        console.warn('[llm] fallback →', lastErr)
        continue
      }

      const json = (await res.json()) as ChatCompletionResponse

      if (json.error || !json.choices?.length) {
        lastErr = new Error(`[${model}] upstream error: ${json.error?.message ?? 'no choices'}`)
        console.warn('[llm] fallback →', lastErr)
        continue
      }

      return { response: json, modelUsed: model }
    } catch (err) {
      lastErr = err
      console.warn('[llm] fallback →', model, err instanceof Error ? err.message : err)
      continue
    }
  }

  throw new Error(
    `Todos los modelos gratuitos fallaron. Último error: ${
      lastErr instanceof Error ? lastErr.message : String(lastErr)
    }`
  )
}
