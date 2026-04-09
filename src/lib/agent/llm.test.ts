import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getAvailableProviders, isLlmConfigured } from './llm'

const names = () => getAvailableProviders().map((s) => s.split(':')[0])

const KEYS = [
  'GROQ_API_KEY',
  'GEMINI_API_KEY',
  'GOOGLE_API_KEY',
  'OPENROUTER_API_KEY',
  'XAI_API_KEY',
  'AI_GATEWAY_API_KEY',
  'VERCEL_OIDC_TOKEN',
] as const

describe('llm provider discovery', () => {
  const snapshot: Record<string, string | undefined> = {}

  beforeEach(() => {
    for (const k of KEYS) {
      snapshot[k] = process.env[k]
      delete process.env[k]
    }
  })

  afterEach(() => {
    for (const k of KEYS) {
      if (snapshot[k] === undefined) delete process.env[k]
      else process.env[k] = snapshot[k]
    }
  })

  it('reports no providers when every env var is missing', () => {
    expect(isLlmConfigured()).toBe(false)
    expect(names()).toEqual([])
  })

  it('with GROQ_API_KEY set, enables groq + groq-oss + groq-qwen', () => {
    process.env.GROQ_API_KEY = 'test-token'
    const providers = names()
    expect(providers).toContain('groq')
    expect(providers).toContain('groq-oss')
    expect(providers).toContain('groq-qwen')
    expect(isLlmConfigured()).toBe(true)
  })

  it('GEMINI_API_KEY or GOOGLE_API_KEY enables gemini provider', () => {
    process.env.GEMINI_API_KEY = 'g'
    expect(names()).toContain('gemini')
    delete process.env.GEMINI_API_KEY
    process.env.GOOGLE_API_KEY = 'g'
    expect(names()).toContain('gemini')
  })

  it('OPENROUTER_API_KEY enables both openrouter + openrouter-mistral', () => {
    process.env.OPENROUTER_API_KEY = 'or'
    const providers = names()
    expect(providers).toContain('openrouter')
    expect(providers).toContain('openrouter-mistral')
  })

  it('groq is ordered before openrouter (primary > fallback)', () => {
    process.env.GROQ_API_KEY = 'g'
    process.env.OPENROUTER_API_KEY = 'or'
    const providers = names()
    expect(providers.indexOf('groq')).toBeLessThan(providers.indexOf('openrouter'))
  })
})
