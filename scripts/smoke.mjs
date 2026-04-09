#!/usr/bin/env node
/**
 * Smoke test contra producción.
 * - Pinguea la home, el API del chat y un par de endpoints críticos.
 * - Falla con exit code 1 si algo regresa mal.
 *
 * Uso:
 *   node scripts/smoke.mjs
 *   SMOKE_BASE_URL=https://preview-x.vercel.app node scripts/smoke.mjs
 */

const BASE = process.env.SMOKE_BASE_URL ?? 'https://tapicascos-next.vercel.app'

const results = []
let failed = 0

async function check(label, fn) {
  const t0 = Date.now()
  try {
    await fn()
    const dt = Date.now() - t0
    results.push({ label, ok: true, dt })
    console.log(`✓ ${label} (${dt}ms)`)
  } catch (e) {
    failed++
    const dt = Date.now() - t0
    results.push({ label, ok: false, dt, err: e.message })
    console.error(`✗ ${label} (${dt}ms): ${e.message}`)
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

await check('GET / → 200', async () => {
  const r = await fetch(BASE)
  assert(r.status === 200, `status ${r.status}`)
})

await check('GET /admin → 307 redirect a login', async () => {
  const r = await fetch(`${BASE}/admin`, { redirect: 'manual' })
  assert([307, 302, 308].includes(r.status), `expected redirect, got ${r.status}`)
})

await check('POST /api/agent/chat rechaza payload sin session_id', async () => {
  const r = await fetch(`${BASE}/api/agent/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'hola' }] }),
  })
  assert(r.status === 400, `expected 400, got ${r.status}`)
})

await check('POST /api/agent/chat responde con reply en ES', async () => {
  const r = await fetch(`${BASE}/api/agent/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: `smoke-${Date.now()}`,
      messages: [{ role: 'user', content: 'Hola, qué servicios tienen?' }],
    }),
  })
  const j = await r.json()
  assert(r.status === 200, `status ${r.status}: ${JSON.stringify(j).slice(0, 200)}`)
  assert(typeof j.reply === 'string' && j.reply.length > 0, 'reply vacía')
})

await check('get_accessories devuelve precios reales', async () => {
  const r = await fetch(`${BASE}/api/agent/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: `smoke-acc-${Date.now()}`,
      messages: [{ role: 'user', content: 'Cuánto cuesta un visor ahumado?' }],
    }),
  })
  const j = await r.json()
  assert(r.status === 200, `status ${r.status}`)
  const body = String(j.reply || '').toLowerCase()
  assert(body.includes('visor') || body.includes('$'), `reply no menciona visor ni precio: ${body.slice(0, 120)}`)
})

console.log()
console.log(`${results.length - failed}/${results.length} OK`)
process.exit(failed > 0 ? 1 : 0)
