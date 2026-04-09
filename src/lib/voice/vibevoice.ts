/**
 * Cliente VibeVoice vía Hugging Face Space (Gradio API REST).
 *
 * Filosofía:
 *  - El Space por defecto es configurable (VIBEVOICE_SPACE).
 *  - Si falla (Space dormido, cuota, sin token), devolvemos null y el
 *    frontend cae al speechSynthesis del navegador: el flujo nunca se rompe.
 *
 * Gradio 4+ expone /gradio_api/call/{fn_index} con handshake:
 *   POST  /gradio_api/call/predict        → { event_id }
 *   GET   /gradio_api/call/predict/{event_id} (SSE) → evento `complete` con data
 */

const DEFAULT_SPACE = process.env.VIBEVOICE_SPACE ?? 'microsoft/VibeVoice-1.5B'
const HF_TOKEN = process.env.HF_TOKEN

function spaceBase(space: string) {
  // microsoft/VibeVoice-1.5B → microsoft-vibevoice-1-5b
  const slug = space.toLowerCase().replace('/', '-').replace(/\./g, '-').replace(/_/g, '-')
  return `https://${slug}.hf.space`
}

export async function synthesizeVibeVoice(
  text: string,
  opts: { voice?: string; fnName?: string } = {}
): Promise<{ audioBase64: string; mime: string } | null> {
  if (!text.trim()) return null

  const space = DEFAULT_SPACE
  const base = spaceBase(space)
  const fn = opts.fnName ?? 'predict'
  const voice = opts.voice ?? 'en-Alice_woman' // VibeVoice default

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (HF_TOKEN) headers.Authorization = `Bearer ${HF_TOKEN}`

  try {
    // 1) Disparar predicción
    const trigger = await fetch(`${base}/gradio_api/call/${fn}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ data: [text, voice] }),
      signal: AbortSignal.timeout(15_000),
    })
    if (!trigger.ok) {
      console.warn('[vibevoice] trigger failed', trigger.status)
      return null
    }
    const { event_id } = (await trigger.json()) as { event_id: string }
    if (!event_id) return null

    // 2) Leer stream SSE hasta evento 'complete'
    const stream = await fetch(`${base}/gradio_api/call/${fn}/${event_id}`, {
      headers,
      signal: AbortSignal.timeout(45_000),
    })
    if (!stream.ok || !stream.body) {
      console.warn('[vibevoice] stream failed', stream.status)
      return null
    }

    const reader = stream.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let audioUrl: string | null = null

    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      // Parsear eventos SSE (líneas "event: X\ndata: Y")
      const events = buffer.split('\n\n')
      buffer = events.pop() ?? ''
      for (const ev of events) {
        const lines = ev.split('\n')
        const eventType = lines.find((l) => l.startsWith('event:'))?.slice(6).trim()
        const dataLine = lines.find((l) => l.startsWith('data:'))?.slice(5).trim()
        if (eventType === 'complete' && dataLine) {
          try {
            const parsed = JSON.parse(dataLine)
            const payload = Array.isArray(parsed) ? parsed[0] : parsed
            // Puede venir como string (url) o como objeto { url, path }
            if (typeof payload === 'string') audioUrl = payload
            else if (payload?.url) audioUrl = payload.url
            else if (payload?.path) audioUrl = `${base}/gradio_api/file=${payload.path}`
          } catch (e) {
            console.warn('[vibevoice] parse complete failed', e)
          }
        }
      }
      if (audioUrl) break
    }

    if (!audioUrl) return null

    // 3) Descargar el audio y devolverlo como base64
    const audioRes = await fetch(audioUrl, {
      headers: HF_TOKEN ? { Authorization: `Bearer ${HF_TOKEN}` } : undefined,
      signal: AbortSignal.timeout(15_000),
    })
    if (!audioRes.ok) return null
    const arrayBuf = await audioRes.arrayBuffer()
    const mime = audioRes.headers.get('content-type') ?? 'audio/wav'
    const base64 = Buffer.from(arrayBuf).toString('base64')
    return { audioBase64: base64, mime }
  } catch (err) {
    console.warn('[vibevoice] error:', err instanceof Error ? err.message : err)
    return null
  }
}
