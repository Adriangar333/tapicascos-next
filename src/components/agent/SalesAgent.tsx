'use client'

import { usePathname } from 'next/navigation'
import { useSalesAgent } from '@/lib/agent/useSalesAgent'
import FloatingLauncher from './FloatingLauncher'
import ChatPanel from './ChatPanel'

/**
 * Composición root del asesor virtual. Toda la lógica vive en
 * `useSalesAgent`; este componente sólo cablea hook → UI.
 */
export default function SalesAgent() {
  const pathname = usePathname()
  const {
    open,
    setOpen,
    msgs,
    busy,
    ttsOn,
    toggleTts,
    sendText,
    uploadPhoto,
    waHandoffLink,
  } = useSalesAgent()

  // No mostrar en el panel admin
  if (pathname?.startsWith('/admin')) return null

  return (
    <>
      <FloatingLauncher open={open} onToggle={() => setOpen((v) => !v)} />
      {open && (
        <ChatPanel
          msgs={msgs}
          busy={busy}
          ttsOn={ttsOn}
          onToggleTts={toggleTts}
          onSend={sendText}
          onUpload={uploadPhoto}
          waHandoffLink={waHandoffLink}
        />
      )}
    </>
  )
}
