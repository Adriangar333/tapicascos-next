/**
 * Genera un slug URL-safe desde un texto en español.
 * - normaliza acentos (NFD)
 * - colapsa no-alfanuméricos a un solo guión
 * - recorta guiones extremos
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
