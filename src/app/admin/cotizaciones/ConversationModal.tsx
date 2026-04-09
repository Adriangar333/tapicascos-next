'use client'

import { useEffect, useState } from 'react'

type ConvMessage = { role: 'user' | 'assistant'; content: string }

export default function ConversationModal({
  quoteId,
  clientName,
}: {
  quoteId: string
  clientName: string
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<ConvMessage[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || messages || loading) return
    setLoading(true)
    fetch(`/api/admin/conversation?quote_id=${quoteId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error)
        else setMessages(data.messages ?? [])
      })
      .catch(() => setError('No se pudo cargar'))
      .finally(() => setLoading(false))
  }, [open, quoteId, messages, loading])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-[10px] px-2 py-1 rounded-md bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 font-semibold"
        title="Ver conversación con el agente IA"
      >
        💬 Ver chat
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-lg max-h-[85vh] bg-[#0F1428] border border-white/10 rounded-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div>
                <h3 className="font-bold text-white">Conversación con Tapi IA</h3>
                <p className="text-xs text-gray-400">{clientName}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-white/10 text-xl"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {loading && <p className="text-sm text-gray-400">Cargando…</p>}
              {error && <p className="text-sm text-red-400">{error}</p>}
              {messages && messages.length === 0 && (
                <p className="text-sm text-gray-500">Sin mensajes guardados.</p>
              )}
              {messages?.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-sm ${
                      m.role === 'user'
                        ? 'bg-[#FF6B35] text-white rounded-br-sm'
                        : 'bg-white/5 border border-white/10 text-gray-100 rounded-bl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
