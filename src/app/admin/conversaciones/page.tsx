'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, RefreshCw, X } from 'lucide-react'

type Msg = { role: 'user' | 'assistant' | 'system' | 'tool'; content: string | null }

type Conv = {
  id: string
  session_id: string
  quote_id: string | null
  turn_count: number | null
  messages: Msg[] | null
  created_at: string
  updated_at: string
}

const fmtDate = (s: string) =>
  new Date(s).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

export default function ConversacionesAdmin() {
  const [items, setItems] = useState<Conv[]>([])
  const [selected, setSelected] = useState<Conv | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    setErrorMsg(null)
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('id, session_id, quote_id, turn_count, messages, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(100)
    if (error) setErrorMsg(error.message)
    if (data) setItems(data as Conv[])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const preview = (c: Conv) => {
    const first = c.messages?.find((m) => m.role === 'user' && m.content)
    return first?.content?.slice(0, 100) ?? '(sin mensajes)'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Conversaciones del chat</h1>
          <p className="text-gray-400 text-sm">
            Últimas 100 sesiones con Tapi ({items.length} visibles)
          </p>
        </div>
        <button
          onClick={fetchData}
          className="px-3 py-2 rounded-xl border border-white/20 text-sm text-gray-300 hover:text-white flex items-center gap-2"
        >
          <RefreshCw size={14} /> Refrescar
        </button>
      </div>

      {errorMsg && (
        <div className="mb-4 text-sm rounded-xl border border-red-400/40 bg-red-400/10 px-3 py-2 text-red-200">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="text-gray-400">Cargando conversaciones...</div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          Aún no hay conversaciones registradas. Cuando alguien chatee con Tapi en el sitio
          aparecerán aquí.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className="admin-card flex items-center gap-4 w-full text-left hover:bg-white/5"
            >
              <MessageSquare size={18} className="text-[#FF6B35] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm truncate">{preview(c)}</p>
                <p className="text-gray-500 text-xs truncate">
                  {fmtDate(c.updated_at)} · {c.turn_count ?? 0} turnos
                  {c.quote_id ? ` · lead #${c.quote_id.slice(0, 8)}` : ''}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Transcript modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="glass p-6 w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="min-w-0">
                <h2 className="text-lg font-bold">Transcript</h2>
                <p className="text-xs text-gray-500 truncate">
                  {fmtDate(selected.updated_at)} · {selected.turn_count ?? 0} turnos ·{' '}
                  {selected.session_id.slice(0, 12)}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-white flex-shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {(selected.messages ?? [])
                .filter((m) => m.role !== 'system' && m.role !== 'tool' && m.content)
                .map((m, i) => (
                  <div
                    key={i}
                    className={`rounded-xl p-3 text-sm ${
                      m.role === 'user'
                        ? 'bg-[#FF6B35]/10 border border-[#FF6B35]/30 ml-8'
                        : 'bg-white/5 border border-white/10 mr-8'
                    }`}
                  >
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
                      {m.role === 'user' ? 'cliente' : 'tapi'}
                    </p>
                    <p className="text-gray-200 whitespace-pre-wrap break-words">{m.content}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
