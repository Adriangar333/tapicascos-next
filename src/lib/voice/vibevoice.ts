/**
 * Cliente VibeVoice vía Hugging Face Space (Gradio API REST).
 *
 * Notas:
 *  - microsoft/VibeVoice-1.5B fue retirado, usamos fork público por default.
 *  - Si el Space falla devolvemos { ok:false, reason } y el frontend cae al
 *    speechSynthesis del navegador. El flujo nunca se rompe.
 *  - warmVibeVoice() se llama desde el cron y al abrir el chat para evitar
 *    cold starts (HF duerme los Spaces tras ~30 min de inactividad).
 */

const DEFAULT_SPACE = process.env.VIBEVOICE_SPACE ?? 'yasserrmd/VibeVoice'
const HF_TOKEN = process.env.HF_TOKEN

export function getVibeVoiceSpace() {
  return DEFAULT_SPACE
}

function spaceBase(space: string) {
  const slug = space
    .toLowerCase()
    .replace('/', '-')
    .replace(/\./g, '-')
    .replace(/_/g, '-')
  return `https://${slug}.hf.space`
}

/** GET al root del Space para despertarlo. No lanza. */
export async function warmVibeVoice(): Promise<{ ok: boolean; status: number; space: string }> {
  const space = DEFAULT_SPACE
  try {
    const res = await fetch(spaceBase(space), {
      method: 'GET',
      headers: HF_TOKEN ? { Authorization: `Bearer ${HF_TOKEN}` } : undefined,
      signal: AbortSignal.timeout(10_000),
    })
    return { ok: res.ok, status: res.status, space }
  } catch {
    return { ok: false, status: 0, space }
  }
}

export type VibeVoiceResult =
  | { ok: true; audioBase64: string; mime: string; space: string }
  | { ok: false; reason: string; space: string; status?: number }

export async function synthesizeVibeVoice(
  text: string,
  opts: { voice?: string; fnName?: string } = {}
): Promise<VibeVoiceResult> {
  const space = DEFAULT_SPACE
  if (!text.trim()) return { ok: false, reason: 'empty_text', space }

  const base = spaceBase(space)
  const fn = opts.fnName ?? 'predict'
  const voice = opts.voice ?? 'en-Alice_woman'

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
      console.warn('[vibevoice] trigger failed', trigger.status, space)
      return { ok: false, reason: 'trigger_failed', space, status: trigger.status }
    }
    const triggerBody = (await trigger.json()) as { event_id?: string }
    const eventId = triggerBody.event_id
    if (!eventId) return { ok: false, reason: 'no_event_id', space }

    // 2) Leer stream SSE hasta evento 'complete'
    const stream = await fetch(`${base}/gradio_api/call/${fn}/${eventId}`, {
      headers,
      signal: AbortSignal.timeout(45_000),
    })
    if (!stream.ok || !stream.body) {
      console.warn('[vibevoice] stream failed', stream.status, space)
      return { ok: false, reason: 'stream_failed', space, status: stream.status }
    }

    const reader = stream.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let audioUrl: string | null = null

    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
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

    if (!audioUrl) return { ok: false, reason: 'no_audio_url', space }

    // 3) Descargar el audio y devolverlo como base64
    const audioRes = await fetch(audioUrl, {
      headers: HF_TOKEN ? { Authorization: `Bearer ${HF_TOKEN}` } : undefined,
      signal: AbortSignal.timeout(15_000),
    })
    if (!audioRes.ok) {
      return { ok: false, reason: 'download_failed', space, status: audioRes.status }
    }
    const arrayBuf = await audioRes.arrayBuffer()
    const mime = audioRes.headers.get('content-type') ?? 'audio/wav'
    const base64 = Buffer.from(arrayBuf).toString('base64')
    return { ok: true, audioBase64: base64, mime, space }
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'unknown_error'
    console.warn('[vibevoice] error:', reason, space)
    return { ok: false, reason, space }
  }
}
