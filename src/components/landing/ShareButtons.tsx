'use client'

import { useState } from 'react'

interface ShareButtonsProps {
  url: string
  text: string
}

function withSource(url: string, source: string) {
  const u = new URL(url)
  u.searchParams.set('utm_source', source)
  return u.toString()
}

export default function ShareButtons({ url, text }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n${withSource(url, 'whatsapp')}`)}`
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(withSource(url, 'facebook'))}`
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(withSource(url, 'twitter'))}`
  const instagramUrl = withSource(url, 'instagram')

  const copyInstagram = async () => {
    try {
      await navigator.clipboard.writeText(instagramUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const btnClass =
    'inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-sm text-white transition-all'

  return (
    <div className="flex flex-wrap gap-2">
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={btnClass}>
        <span>💬</span> WhatsApp
      </a>
      <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className={btnClass}>
        <span>📘</span> Facebook
      </a>
      <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className={btnClass}>
        <span>🐦</span> X / Twitter
      </a>
      <button onClick={copyInstagram} className={btnClass} type="button">
        <span>📸</span> {copied ? '¡Link copiado!' : 'Instagram (copiar link)'}
      </button>
    </div>
  )
}
