/** Reglas de archivos de evidencia (iguales a las del backend). */
export const EXTENSIONES_PERMITIDAS = ['jpg', 'jpeg', 'png', 'webp', 'pdf'] as const
export const ACCEPT = EXTENSIONES_PERMITIDAS.map((e) => `.${e}`).join(',')
export const MAX_ARCHIVOS = 3
export const MAX_MB = 10
export const MAX_BYTES = MAX_MB * 1024 * 1024

export const extension = (nombre: string) =>
  nombre.includes('.') ? nombre.split('.').pop()!.toLowerCase() : ''

export const esImagen = (nombre: string) => ['jpg', 'jpeg', 'png', 'webp'].includes(extension(nombre))

export function formatearBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/** Regresa el motivo del rechazo, o null si el archivo es válido. */
export function validarArchivo(archivo: File, maxBytes = MAX_BYTES): string | null {
  if (!(EXTENSIONES_PERMITIDAS as readonly string[]).includes(extension(archivo.name)))
    return `"${archivo.name}": formato no permitido (solo JPG, PNG, WEBP o PDF).`
  if (archivo.size === 0) return `"${archivo.name}": el archivo está vacío.`
  if (archivo.size > maxBytes)
    return `"${archivo.name}": pesa ${formatearBytes(archivo.size)} y el máximo es ${formatearBytes(maxBytes)}.`
  return null
}
