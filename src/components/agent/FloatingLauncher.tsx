'use client'

type Props = {
  open: boolean
  onToggle: () => void
}

export default function FloatingLauncher({ open, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      aria-label={open ? 'Cerrar asesor virtual' : 'Abrir asesor virtual'}
      className={`fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-2xl transition-all hover:scale-110 ${
        open ? 'bg-gray-700' : 'bg-gradient-to-br from-[#FF6B35] to-[#FFD700]'
      }`}
      style={{ boxShadow: '0 0 30px rgba(255,107,53,0.5)' }}
    >
      <span className="text-2xl">{open ? '×' : '💬'}</span>
      {!open && (
        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-400 ring-2 ring-[#0A0E1A] animate-pulse" />
      )}
    </button>
  )
}
