import { NextRequest, NextResponse } from 'next/server'
import { SYSTEM_PROMPT } from '@/lib/agent/prompts'
import { TOOLS, runTool } from '@/lib/agent/tools'
import { checkRateLimit } from '@/lib/agent/rateLimit'
import { createClient } from '@/lib/supabase/server'
import {
  callOpenRouter,
  describeHelmetImage,
  getAvailableProviders,
  isLlmConfigured,
  type OpenAIMessage,
} from '@/lib/agent/llm'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_ITERATIONS = 6

type ClientMessage = {
  role: 'user' | 'assistant'
  content: string
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

export async function POST(req: NextRequest) {
  const providersAvailable = getAvailableProviders()
  console.log('[agent/chat] providers available:', providersAvailable.join(', ') || 'NONE')
  console.log('[agent/chat] env check:', {
    GROQ_API_KEY: !!process.env.GROQ_API_KEY,
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    OPENROUTER_API_KEY: !!process.env.OPENROUTER_API_KEY,
    XAI_API_KEY: !!process.env.XAI_API_KEY,
    AI_GATEWAY_API_KEY: !!process.env.AI_GATEWAY_API_KEY,
    VERCEL_OIDC_TOKEN: !!process.env.VERCEL_OIDC_TOKEN,
  })

  if (!isLlmConfigured()) {
    return NextResponse.json(
      {
        reply:
          'El asesor virtual está temporalmente fuera de servicio 🔧. Escríbenos directo por WhatsApp y con mucho gusto te atendemos.',
        error: 'llm_not_configured',
        debug: { providersAvailable },
      },
      { status: 200 }
    )
  }

  const ip = getClientIp(req)
  const rl = checkRateLimit(ip)
  if (!rl.allowed) {
    return NextResponse.json(
      {
        reply:
          'Estás enviando mensajes muy rápido. Dame un momento o continúa por WhatsApp 🙂.',
        error: 'rate_limited',
      },
      { status: 429 }
    )
  }

  let body: { messages: ClientMessage[]; session_id: string; latest_photo_url?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { messages = [], session_id, latest_photo_url } = body
  if (!session_id || !Array.isArray(messages)) {
    return NextResponse.json({ error: 'Missing session_id or messages' }, { status: 400 })
  }

  const history = messages.slice(-30)

  // Historial en formato OpenAI
  const conversation: OpenAIMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map((m) => ({ role: m.role, content: m.content }) as OpenAIMessage),
  ]

  // Visión: si el usuario acaba de adjuntar foto, describirla con un modelo
  // multimodal ANTES del loop e inyectar el resultado como nota del sistema
  // para que Tapi no alucine detalles.
  if (latest_photo_url && /^https?:\/\//.test(latest_photo_url)) {
    try {
      const desc = await describeHelmetImage(latest_photo_url)
      if (desc) {
        visionStatus = 'ok'
        visionDescription = desc
        conversation.push({
          role: 'system',
          content: `[info visual de la foto que el cliente acaba de enviar]: ${desc}`,
        })
      } else {
        visionStatus = 'failed'
        conversation.push({
          role: 'system',
          content:
            '[info visual de la foto]: no disponible. No describas la foto, solo confirma que la recibiste y pide al cliente que te cuente qué parte quiere intervenir.',
        })
      }
    } catch (visionErr) {
      visionStatus = 'failed'
      console.warn('[agent/chat] vision error:', visionErr)
    }
  }

  let savedQuoteId: string | null = null
  let assistantText = ''
  let iterations = 0
  let modelUsed = ''
  let visionStatus: 'ok' | 'failed' | 'skipped' = 'skipped'
  let visionDescription: string | null = null

  try {
    while (iterations < MAX_ITERATIONS) {
      iterations++

      const { response, modelUsed: used } = await callOpenRouter({
        messages: conversation,
        tools: TOOLS,
        temperature: 0.4,
        maxTokens: 1024,
      })
      modelUsed = used

      const choice = response.choices[0]
      const msg = choice.message
      let toolCalls = msg.tool_calls ?? []

      // Fallback: algunos modelos (Llama) emiten tool calls como texto
      // `<function=name>{...}</function>` o `<function=name></function>`
      // en vez de usar el campo tool_calls. Los parseamos manualmente.
      if (!toolCalls.length && msg.content) {
        const re = /<function=([a-zA-Z_][\w]*)>([\s\S]*?)<\/function>/g
        const parsed: typeof toolCalls = []
        let m: RegExpExecArray | null
        let idx = 0
        while ((m = re.exec(msg.content)) !== null) {
          const name = m[1]
          let args = (m[2] || '').trim()
          if (!args || args === '{}') args = '{}'
          // Validar que sea JSON; si no, envolver
          try {
            JSON.parse(args)
          } catch {
            args = '{}'
          }
          parsed.push({
            id: `call_${Date.now()}_${idx++}`,
            type: 'function',
            function: { name, arguments: args },
          })
        }
        if (parsed.length) {
          toolCalls = parsed
          // Limpia el texto para que no se muestre al usuario
          msg.content = msg.content.replace(re, '').trim() || null
        }
      }

      if (!toolCalls.length) {
        assistantText = msg.content ?? ''
        conversation.push({ role: 'assistant', content: assistantText })
        break
      }

      // Asistente con tool_calls: lo persistimos tal cual
      conversation.push({
        role: 'assistant',
        content: msg.content ?? null,
        tool_calls: toolCalls,
      })

      // Ejecutar cada tool y responder con role:'tool'
      for (const tc of toolCalls) {
        let input: Record<string, unknown> = {}
        try {
          input = JSON.parse(tc.function.arguments || '{}')
        } catch {
          // ignora args mal formados
        }
        let result: string
        try {
          result = await runTool(tc.function.name, input)
        } catch (toolErr) {
          const tmsg = toolErr instanceof Error ? toolErr.message : 'unknown'
          console.error('[agent/chat] tool error:', tc.function.name, tmsg)
          result = JSON.stringify({ error: `tool_failed: ${tmsg}` })
        }

        conversation.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: result,
        })

        if (tc.function.name === 'save_lead') {
          try {
            const parsed = JSON.parse(result)
            if (parsed.quote_id) savedQuoteId = parsed.quote_id
          } catch {}
        }
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown'
    const is429 = /429|rate.?limit|quota/i.test(message)
    console.error('[agent/chat] upstream error:', message, { is429, iterations, providersAvailable })
    return NextResponse.json(
      {
        reply: is429
          ? 'Estoy recibiendo muchísimos mensajes justo ahora 😅. Dame 30 segundos y vuelve a intentarlo, o continúa por WhatsApp para que te atendamos de una.'
          : 'Tuve un problema técnico. Intenta de nuevo o escríbenos por WhatsApp directamente.',
        error: is429 ? 'rate_limited_upstream' : 'upstream_error',
        debug: { message, providersAvailable, iterations },
      },
      { status: 200 },
    )
  }

  // Persistir conversación en Supabase (fire & forget)
  try {
    const supabase = await createClient()
    const plainMessages = [
      ...history,
      { role: 'assistant' as const, content: assistantText },
    ]

    const { data: existing } = await supabase
      .from('ai_conversations')
      .select('id, turn_count')
      .eq('session_id', session_id)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('ai_conversations')
        .update({
          messages: plainMessages,
          turn_count: existing.turn_count + 1,
          quote_id: savedQuoteId ?? undefined,
        })
        .eq('id', existing.id)
    } else {
      await supabase.from('ai_conversations').insert({
        session_id,
        messages: plainMessages,
        turn_count: 1,
        quote_id: savedQuoteId,
      })
    }
  } catch (err) {
    console.error('[agent/chat] persist error:', err)
  }

  return NextResponse.json({
    reply: assistantText || 'Perdón, se me fue la respuesta. ¿Puedes repetirme?',
    quote_id: savedQuoteId,
    model: modelUsed,
    debug: { vision: visionStatus, vision_desc: visionDescription },
  })
}
