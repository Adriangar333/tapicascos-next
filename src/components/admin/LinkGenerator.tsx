'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { Link2, Copy, Check } from 'lucide-react'

interface ServiceLite {
  id: string
  name: string
  slug: string | null
  image_url: string | null
  price_min: number
  price_max: number | null
  description: string | null
}

const SITE_URL = 'https://tapicascos-next.vercel.app'

const sourcePresets = [
  { value: 'instagram', label: 'Instagram', icon: '📸', color: 'from-pink-500 to-purple-600' },
  { value: 'facebook', label: 'Facebook', icon: '📘', color: 'from-blue-600 to-blue-800' },
  { value: 'whatsapp', label: 'WhatsApp', icon: '💬', color: 'from-green-500 to-green-700' },
  { value: 'tiktok', label: 'TikTok', icon: '🎵', color: 'from-gray-800 to-black' },
  { value: 'google', label: 'Google', icon: '🔍', color: 'from-yellow-500 to-red-500' },
  { value: 'email', label: 'Email', icon: '✉️', color: 'from-gray-500 to-gray-700' },
]

function formatPrice(min: number, max: number | null): string {
  const fmt = (n: number) => '$' + n.toLocaleString('es-CO')
  if (!max || max === min) return `Desde ${fmt(min)}`
  return `${fmt(min)} — ${fmt(max)}`
}

export default function LinkGenerator({ services }: { services: ServiceLite[] }) {
  const [selectedId, setSelectedId] = useState<string>(services[0]?.id ?? '')
  const [source, setSource] = useState('instagram')
  const [medium, setMedium] = useState('social')
  const [campaign, setCampaign] = useState('')
  const [copied, setCopied] = useState(false)

  const service = services.find((s) => s.id === selectedId)

  const generatedUrl = useMemo(() => {
    if (!service?.slug) return ''
    const url = new URL(`${SITE_URL}/servicios/${service.slug}`)
    if (source) url.searchParams.set('utm_source', source)
    if (medium) url.searchParams.set('utm_medium', medium)
    if (campaign) url.searchParams.set('utm_campaign', campaign)
    return url.toString()
  }, [service, source, medium, campaign])

  const shareText = service
    ? `${service.name} en Tapicascos Barranquilla — ${formatPrice(service.price_min, service.price_max)}`
    : ''

  const waUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${generatedUrl}`)}`
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(generatedUrl)}`
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(generatedUrl)}`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: service?.name, text: shareText, url: generatedUrl })
      } catch {}
    } else {
      copyLink()
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* FORM */}
      <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Link2 size={20} /> Configura tu link
        </h2>

        <label className="block text-sm font-medium text-gray-300 mb-2">
          Selecciona un servicio
        </label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#FF6B35] focus:outline-none mb-5"
        >
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-300 mb-2">Canal (origen)</label>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {sourcePresets.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setSource(p.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                  source === p.value
                    ? 'border-[#FF6B35] bg-[#FF6B35]/10 text-white'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {p.icon} {p.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="o escribe uno personalizado"
            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:border-[#FF6B35] focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Medio</label>
            <input
              type="text"
              value={medium}
              onChange={(e) => setMedium(e.target.value)}
              placeholder="social, email, cpc"
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:border-[#FF6B35] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Campaña</label>
            <input
              type="text"
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              placeholder="lanzamiento_abril"
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:border-[#FF6B35] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Link generado</label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={generatedUrl}
              className="flex-1 px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-sm font-mono text-gray-300 focus:outline-none"
            />
            <button
              onClick={copyLink}
              className="px-4 rounded-xl bg-[#FF6B35] hover:bg-[#FF6B35]/80 transition-all flex items-center gap-2 text-sm font-semibold"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>
      </div>

      {/* PREVIEW + SHARE */}
      <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
        <h2 className="text-xl font-bold mb-4">Vista previa</h2>

        {service && (
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/30 mb-6">
            {service.image_url ? (
              <div className="relative w-full aspect-[1200/630] bg-black/40">
                <Image
                  src={service.image_url}
                  alt={service.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            ) : (
              <div className="w-full aspect-[1200/630] bg-white/5 flex items-center justify-center text-gray-500">
                Sin imagen
              </div>
            )}
            <div className="p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                tapicascos-next.vercel.app
              </p>
              <h3 className="text-lg font-bold text-white mb-1">{service.name}</h3>
              <p className="text-[#FF6B35] font-semibold">
                {formatPrice(service.price_min, service.price_max)}
              </p>
              {service.description && (
                <p className="text-sm text-gray-400 mt-2 line-clamp-2">{service.description}</p>
              )}
            </div>
          </div>
        )}

        <p className="text-sm font-medium text-gray-300 mb-3">Compartir en</p>
        <div className="grid grid-cols-2 gap-3">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-600 hover:bg-green-700 font-semibold text-white transition-all"
          >
            💬 WhatsApp
          </a>
          <a
            href={fbUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 font-semibold text-white transition-all"
          >
            📘 Facebook
          </a>
          <a
            href={xUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-black border border-white/20 hover:bg-white/10 font-semibold text-white transition-all"
          >
            🐦 X / Twitter
          </a>
          <button
            onClick={nativeShare}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:opacity-90 font-semibold text-white transition-all"
          >
            📸 Instagram / Story
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-3 text-center">
          En móvil el botón de Instagram abre el menú nativo para publicar como historia. En desktop copia el link.
        </p>
      </div>
    </div>
  )
}
