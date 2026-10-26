import { api } from '@/core/http/cliente'
import { normalizarIncidencia } from './normalizar'
import type { EvidenciaLigar, EvidenciaSubida, Incidencia } from '../types/incidencia.types'

/** Subir hasta 3 archivos de 10 MB necesita más de los 30 s normales. */
const TIMEOUT_SUBIDA_MS = 120_000

/**
 * POST /api/evidencias/upload — Root, Rep, Téc.
 * multipart/form-data, campo `archivos` repetido (1 a 3 archivos, máx. 10 MB c/u).
 * Sin Content-Type: el navegador lo pone con su boundary.
 */
export function subir(archivos: File[]) {
  const fd = new FormData()
  archivos.forEach((a) => fd.append('archivos', a))
  return api.post<EvidenciaSubida[]>('/api/evidencias/upload', fd, { timeout: TIMEOUT_SUBIDA_MS })
}

/** PATCH /api/incidencias/{id}/evidencias — liga a la incidencia los archivos ya subidos. */
export const ligar = async (idIncidencia: string, evidencias: EvidenciaLigar[]) =>
  normalizarIncidencia(
    await api.patch<Incidencia>(`/api/incidencias/${encodeURIComponent(idIncidencia)}/evidencias`, { evidencias }),
  )
