import { describe, it, expect } from 'vitest'
import { formatPrice, sanitizePhone, isValidPhone } from './tools'

describe('formatPrice', () => {
  it('uses "desde" when max is null', () => {
    expect(formatPrice(15000, null)).toBe('desde $15.000')
  })

  it('uses "desde" when max equals min', () => {
    expect(formatPrice(15000, 15000)).toBe('desde $15.000')
  })

  it('renders a range when min != max', () => {
    expect(formatPrice(15000, 30000)).toBe('$15.000 – $30.000')
  })

  it('uses es-CO dot thousands separator', () => {
    expect(formatPrice(1250000, null)).toBe('desde $1.250.000')
  })

  it('max=0 falls back to "desde" (truthiness guard)', () => {
    // 0 is falsy — documented behavior, catches regressions if logic changes
    expect(formatPrice(10000, 0)).toBe('desde $10.000')
  })
})

describe('sanitizePhone', () => {
  it('removes spaces, dashes and parentheses', () => {
    expect(sanitizePhone('+57 (300) 123-4567')).toBe('573001234567')
  })

  it('strips alphabetic characters', () => {
    expect(sanitizePhone('call 3001234567 now')).toBe('3001234567')
  })

  it('returns empty string when no digits', () => {
    expect(sanitizePhone('---')).toBe('')
  })
})

describe('isValidPhone', () => {
  it('accepts a 10-digit Colombian mobile', () => {
    expect(isValidPhone('3001234567')).toBe(true)
  })

  it('accepts formatted +57 numbers (12 digits after strip)', () => {
    expect(isValidPhone('+57 300 123 4567')).toBe(true)
  })

  it('rejects numbers shorter than 10 digits', () => {
    expect(isValidPhone('300123')).toBe(false)
  })

  it('rejects numbers longer than 13 digits', () => {
    expect(isValidPhone('12345678901234')).toBe(false)
  })

  it('rejects text-only input', () => {
    expect(isValidPhone('no es un telefono')).toBe(false)
  })
})
