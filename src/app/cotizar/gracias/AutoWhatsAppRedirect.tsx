'use client'

import { useEffect } from 'react'

export default function AutoWhatsAppRedirect({ url }: { url: string }) {
  useEffect(() => {
    const t = setTimeout(() => {
      window.location.href = url
    }, 1500)
    return () => clearTimeout(t)
  }, [url])
  return null
}
