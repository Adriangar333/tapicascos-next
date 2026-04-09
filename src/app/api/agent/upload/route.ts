import { NextRequest, NextResponse } from 'next/server'
import { fileTypeFromBuffer } from 'file-type'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic'])

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')
    const sessionId = (formData.get('session_id') as string) || 'unknown'

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Archivo supera 5MB' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const detected = await fileTypeFromBuffer(buffer)

    if (!detected || !ALLOWED_MIMES.has(detected.mime)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Solo JPG, PNG, WebP o HEIC.' },
        { status: 400 }
      )
    }

    const ext = detected.ext
    const path = `${sessionId}/${Date.now()}.${ext}`

    const supabase = await createClient()
    const { error: uploadErr } = await supabase.storage
      .from('leads')
      .upload(path, buffer, {
        contentType: detected.mime,
        upsert: false,
      })

    if (uploadErr) {
      return NextResponse.json({ error: uploadErr.message }, { status: 500 })
    }

    // Generar URL firmada corta para que el cliente vea la miniatura
    const { data: signed } = await supabase.storage
      .from('leads')
      .createSignedUrl(path, 60 * 60 * 24 * 7) // 7 días

    return NextResponse.json({
      path,
      url: signed?.signedUrl ?? null,
    })
  } catch (err) {
    console.error('[agent/upload] error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
