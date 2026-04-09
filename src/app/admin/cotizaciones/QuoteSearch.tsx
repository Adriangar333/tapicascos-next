'use client'

import { useEffect, useState } from 'react'

/**
 * Filtro client-side por nombre/teléfono/descripción.
 * Esconde las cards de quotes que no matchean tocando data-attrs.
 */
export default function QuoteSearch() {
  const [q, setQ] = useState('')

  useEffect(() => {
    const term = q.trim().toLowerCase()
    const cards = document.querySelectorAll<HTMLElement>('[data-quote-card]')
    let shown = 0
    cards.forEach((el) => {
      const text = (el.dataset.quoteSearch || '').toLowerCase()
      const match = !term || text.includes(term)
      el.style.display = match ? '' : 'none'
      if (match) shown++
    })
    const counter = document.getElementById('quote-search-count')
    if (counter) counter.textContent = term ? `${shown} resultado(s)` : ''
  }, [q])

  return (
    <div className="flex items-center gap-3">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por nombre, teléfono o descripción…"
        className="input-field text-sm w-64 max-w-full"
      />
      <span id="quote-search-count" className="text-xs text-gray-500" />
    </div>
  )
}
