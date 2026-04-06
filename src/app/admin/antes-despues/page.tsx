import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { createBeforeAfter, deleteBeforeAfter, toggleBeforeAfter } from './actions'

export const dynamic = 'force-dynamic'

export default async function AdminBeforeAfterPage() {
  const supabase = await createClient()
  const { data: items } = await supabase
    .from('before_after')
    .select('*')
    .order('sort_order', { ascending: true })

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-3xl font-black mb-2">Antes y después</h1>
      <p className="text-gray-400 mb-8">
        Sube pares de fotos del mismo casco antes y después de tu trabajo. Se mostrarán
        en la landing como un slider interactivo.
      </p>

      {/* Create form */}
      <form action={createBeforeAfter} className="p-6 rounded-2xl border border-white/10 bg-white/5 mb-10 space-y-4">
        <h2 className="text-lg font-bold">Nuevo par de fotos</h2>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Título *</label>
          <input name="title" required className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10" placeholder="Ej: Shaft 551 restaurado" />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Descripción</label>
          <input name="description" className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10" placeholder="Tapizado integral con cuero premium" />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">URL foto ANTES *</label>
            <input name="before_url" required className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">URL foto DESPUÉS *</label>
            <input name="after_url" required className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10" placeholder="https://..." />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Orden</label>
            <input name="sort_order" type="number" defaultValue={0} className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10" />
          </div>
          <label className="flex items-center gap-2 mt-6 text-sm">
            <input type="checkbox" name="active" defaultChecked /> Activo
          </label>
        </div>

        <button type="submit" className="btn-primary">Agregar</button>
        <p className="text-xs text-gray-500">
          Tip: sube las fotos primero al bucket <code>images</code> de Supabase Storage o a la galería, copia su URL pública y pégala aquí.
        </p>
      </form>

      {/* List */}
      <div className="space-y-4">
        {(items ?? []).map((it) => (
          <div key={it.id} className="p-4 rounded-xl border border-white/10 bg-white/5 flex gap-4 items-center">
            <div className="flex gap-1">
              <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-black/30">
                <Image src={it.before_url} alt="antes" fill className="object-cover" sizes="80px" />
              </div>
              <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-black/30">
                <Image src={it.after_url} alt="después" fill className="object-cover" sizes="80px" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-bold">{it.title}</h3>
              {it.description && <p className="text-sm text-gray-400">{it.description}</p>}
              <p className="text-xs text-gray-500 mt-1">
                Orden: {it.sort_order} · {it.active ? 'Activo' : 'Oculto'}
              </p>
            </div>
            <form action={toggleBeforeAfter}>
              <input type="hidden" name="id" value={it.id} />
              <input type="hidden" name="active" value={String(it.active)} />
              <button className="px-3 py-1 text-xs rounded-lg border border-white/20 hover:bg-white/10">
                {it.active ? 'Ocultar' : 'Mostrar'}
              </button>
            </form>
            <form action={deleteBeforeAfter}>
              <input type="hidden" name="id" value={it.id} />
              <button className="px-3 py-1 text-xs rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10">
                Eliminar
              </button>
            </form>
          </div>
        ))}
        {(!items || items.length === 0) && (
          <p className="text-gray-500 text-sm">Aún no hay pares de antes/después.</p>
        )}
      </div>
    </div>
  )
}
