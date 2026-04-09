'use client'

import { useEffect, useRef } from 'react'
import { mdBold } from './mdBold'
import type { AgentMsg } from '@/lib/agent/useSalesAgent'

type Props = {
  msgs: AgentMsg[]
  busy: boolean
}

export default function MessageList({ msgs, busy }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [msgs, busy])

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
      {msgs.map((m, i) => (
        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div
            className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
              m.role === 'user'
                ? 'bg-[#FF6B35] text-white rounded-br-sm'
                : 'bg-white/5 border border-white/10 text-gray-100 rounded-bl-sm'
            }`}
          >
            {m.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={m.photoUrl}
                alt="Foto enviada"
                className="rounded-lg mb-2 max-w-full h-auto"
              />
            )}
            <span className="whitespace-pre-wrap">{mdBold(m.content)}</span>
          </div>
        </div>
      ))}
      {busy && (
        <div className="flex justify-start">
          <div className="bg-white/5 border border-white/10 px-3.5 py-2.5 rounded-2xl rounded-bl-sm">
            <span className="inline-flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B35] animate-bounce" />
              <span
                className="h-1.5 w-1.5 rounded-full bg-[#FF6B35] animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <span
                className="h-1.5 w-1.5 rounded-full bg-[#FF6B35] animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
