import { describe, it, expect } from 'vitest'
import { slugify } from './slug'

describe('slugify', () => {
  it('lowercases ASCII input', () => {
    expect(slugify('Tapizado Premium')).toBe('tapizado-premium')
  })

  it('strips Spanish accents via NFD normalization', () => {
    expect(slugify('Reparación Económica')).toBe('reparacion-economica')
    expect(slugify('Ñandú Mañana')).toBe('nandu-manana')
  })

  it('collapses non-alphanumerics into a single dash', () => {
    expect(slugify('a   b___c!!!d')).toBe('a-b-c-d')
  })

  it('trims leading/trailing dashes', () => {
    expect(slugify('  --hola--  ')).toBe('hola')
  })

  it('returns empty string for empty or punctuation-only input', () => {
    expect(slugify('')).toBe('')
    expect(slugify('!!!---...')).toBe('')
  })

  it('is idempotent on already-slugged strings', () => {
    expect(slugify('tapizado-premium')).toBe('tapizado-premium')
  })

  it('handles mixed digits and letters', () => {
    expect(slugify('Casco LS2 501 v2')).toBe('casco-ls2-501-v2')
  })
})
