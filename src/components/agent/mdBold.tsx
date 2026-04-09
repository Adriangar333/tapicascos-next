import type { ReactNode } from 'react'

/** Soporte mínimo para `**bold**` sin dependencias. */
export function mdBold(s: string): ReactNode[] {
  const parts = s.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? (
      <strong key={i} className="font-bold text-white">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  )
}
