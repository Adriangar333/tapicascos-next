'use client'

import Image from 'next/image'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import type { AgentMsg } from '@/lib/agent/useSalesAgent'

type Props = {
  msgs: AgentMsg[]
  busy: boolean
  ttsOn: boolean
  onToggleTts: () => void
  onSend: (text: string) => void
  onUpload: (file: File) => void
  waHandoffLink: string | null
}

export default function ChatPanel({
  msgs,
  busy,
  ttsOn,
  onToggleTts,
  onSend,
  onUpload,
  waHandoffLink,
}: Props) {
  return (
    <div
      className="fixed bottom-[88px] right-6 z-50 w-[360px] max-w-[calc(100vw-32px)] h-[540px] max-h-[calc(100vh-120px)] rounded-2xl border border-white/10 bg-[#0A0E1A] shadow-2xl flex flex-col overflow-hidden"
      style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 40px rgba(255,107,53,0.15)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-gradient-to-r from-[#FF6B35]/20 to-transparent">
        <div className="relative h-10 w-10 rounded-full bg-[#FF6B35]/20 flex items-center justify-center">
          <Image
            src="/logo-tapicascos.webp"
            alt="Tapi"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-[#0A0E1A]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-white">Tapi · Asesor virtual</p>
          <p className="text-[11px] text-green-400">En línea · responde al instante</p>
        </div>
        <button
          type="button"
          onClick={onToggleTts}
          aria-label={ttsOn ? 'Silenciar voz' : 'Activar voz'}
          title={ttsOn ? 'Silenciar voz' : 'Activar voz'}
          className={`h-9 w-9 rounded-full flex items-center justify-center text-base transition-colors ${
            ttsOn ? 'bg-[#FF6B35]/30 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          {ttsOn ? '🔊' : '🔇'}
        </button>
      </div>

      <MessageList msgs={msgs} busy={busy} />

      {waHandoffLink && (
        <a
          href={waHandoffLink}
          target="_blank"
          rel="noopener"
          className="mx-4 mb-2 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-sm font-bold transition-colors"
        >
          ✅ Continuar por WhatsApp
        </a>
      )}

      <ChatInput busy={busy} onSend={onSend} onUpload={onUpload} />
    </div>
  )
}
