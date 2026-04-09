import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { SYSTEM_PROMPT } from '@/lib/agent/prompts'
import { TOOLS, runTool } from '@/lib/agent/tools'
import { checkRateLimit } from '@/lib/agent/rateLimit'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MODEL = 'claude-haiku-4-5-20251001'
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
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      {
        reply:
          'El asesor virtual está temporalmente fuera de servicio 🔧. Escríbenos directo por WhatsApp y con mucho gusto te atendemos.',
        error: 'missing_api_key',
      },
      { status: 200 }
    )
  }

  // Rate limit
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

  let body: { messages: ClientMessage[]; session_id: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { messages = [], session_id } = body
  if (!session_id || !Array.isArray(messages)) {
    return NextResponse.json({ error: 'Missing session_id or messages' }, { status: 400 })
  }

  // Cap historial para proteger contexto/costo
  const history = messages.slice(-30)

  const anthropic = new Anthropic({ apiKey })

  // Construimos el historial en formato Anthropic
  const conversation: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role,
    content: m.content,
  }))

  let savedQuoteId: string | null = null
  let assistantText = ''
  let iterations = 0

  try {
    while (iterations < MAX_ITERATIONS) {
      iterations++

      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1024,
        temperature: 0.4,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages: conversation,
      })

      // Recolectar texto y posibles tool_use
      const toolUses: Array<{ id: string; name: string; input: Record<string, unknown> }> = []
      let turnText = ''

      for (const block of response.content) {
        if (block.type === 'text') {
          turnText += block.text
        } else if (block.type === 'tool_use') {
          toolUses.push({
            id: block.id,
            name: block.name,
            input: block.input as Record<string, unknown>,
          })
        }
      }

      if (turnText) assistantText = turnText

      // Sin tools → fin del loop
      if (response.stop_reason !== 'tool_use' || toolUses.length === 0) {
        // Persistir assistant turn al historial conversacional (por consistencia)
        conversation.push({ role: 'assistant', content: response.content })
        break
      }

      // Persistir el turn assistant con los tool_use
      conversation.push({ role: 'assistant', content: response.content })

      // Ejecutar tools y alimentar resultados
      const toolResults: Anthropic.ToolResultBlockParam[] = []
      for (const tu of toolUses) {
        const result = await runTool(tu.name, tu.input)
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          content: result,
        })

        // Capturar quote_id si save_lead tuvo éxito
        if (tu.name === 'save_lead') {
          try {
            const parsed = JSON.parse(result)
            if (parsed.quote_id) savedQuoteId = parsed.quote_id
          } catch {}
        }
      }

      conversation.push({ role: 'user', content: toolResults })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown'
    console.error('[agent/chat] Anthropic error:', message)
    return NextResponse.json(
      {
        reply:
          'Tuve un problema técnico. Intenta de nuevo o escríbenos por WhatsApp directamente.',
        error: 'upstream_error',
      },
      { status: 200 }
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
  })
}
