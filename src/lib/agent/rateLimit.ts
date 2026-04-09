// Simple in-memory sliding window. Para producción con múltiples instancias,
// migrar a Upstash Redis o Vercel KV.
const buckets = new Map<string, number[]>()

const WINDOW_MS = 10 * 60 * 1000 // 10 minutos
const MAX_REQUESTS = 20

export function checkRateLimit(key: string): {
  allowed: boolean
  remaining: number
  resetAt: number
} {
  const now = Date.now()
  const cutoff = now - WINDOW_MS
  const history = (buckets.get(key) ?? []).filter((t) => t > cutoff)

  if (history.length >= MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: (history[0] ?? now) + WINDOW_MS,
    }
  }

  history.push(now)
  buckets.set(key, history)

  // GC ocasional — si el mapa crece mucho, limpiamos entradas viejas
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => t <= cutoff)) buckets.delete(k)
    }
  }

  return {
    allowed: true,
    remaining: MAX_REQUESTS - history.length,
    resetAt: now + WINDOW_MS,
  }
}
