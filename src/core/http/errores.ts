import axios from 'axios'
import type { ApiResponse } from '@/core/types/api'
import { acortar } from '@/core/utils/validacion'

/** Cuerpo de la respuesta solo si es un objeto JSON (si llega HTML o texto, se ignora). */
function cuerpo(error: unknown): Partial<ApiResponse<unknown>> | null {
  if (!axios.isAxiosError(error)) return null
  const d = error.response?.data
  return d && typeof d === 'object' && !Array.isArray(d) ? (d as Partial<ApiResponse<unknown>>) : null
}

/** errors[{campo,mensaje}] → { campo: mensaje } (la primera por campo). */
export function aMapa(error: unknown): Record<string, string> {
  const mapa: Record<string, string> = {}
  const lista = cuerpo(error)?.errors
  if (!Array.isArray(lista) || !lista.length) {
    // Algunos 400 solo traen el texto «El campo 'titulo' contiene…»: se ubica el campo para marcarlo.
    const texto = cuerpo(error)?.message
    const m = typeof texto === 'string' ? /campo '([A-Za-z_][\w.]*)'/i.exec(texto) : null
    if (m) {
      const k = m[1]!
      mapa[k] = texto as string
      const min = k.charAt(0).toLowerCase() + k.slice(1)
      if (!(min in mapa)) mapa[min] = texto as string
    }
    return mapa
  }
  for (const e of lista) {
    if (!e || typeof e.campo !== 'string' || typeof e.mensaje !== 'string' || !e.campo) continue
    const clave = e.campo
    if (!(clave in mapa)) mapa[clave] = e.mensaje
    // .NET suele mandar "Titulo"; el front usa "titulo": se acepta de las dos formas.
    const minuscula = clave.charAt(0).toLowerCase() + clave.slice(1)
    if (!(minuscula in mapa)) mapa[minuscula] = e.mensaje
  }
  return mapa
}

/**
 * Primer error que corresponda a alguno de los campos: exacto (`horas`) o de una posición
 * de lista (`agregar[0]`, `agregar.0`, `evidencias[1].publicId`).
 */
export function primerError(mapa: Record<string, string>, ...campos: string[]): string {
  for (const c of campos) {
    if (mapa[c]) return mapa[c]
    const k = Object.keys(mapa).find((x) => x.startsWith(`${c}[`) || x.startsWith(`${c}.`))
    if (k) return mapa[k] ?? ''
  }
  return ''
}

/** ¿El error de red es por tiempo agotado? */
const esTimeout = (e: unknown) => axios.isAxiosError(e) && (e.code === 'ECONNABORTED' || e.code === 'ETIMEDOUT')

/** Mensaje general para mostrar al usuario (siempre texto corto y legible). */
export function mensajeError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (esTimeout(error)) return 'El servidor tardó demasiado en responder. Intenta de nuevo.'
    if (error.code === 'ERR_CANCELED') return 'La solicitud fue cancelada.'
    if (!error.response) return 'No se pudo conectar con el servidor. Intenta más tarde.'
    const status = error.response.status
    const msg = cuerpo(error)?.message
    if (typeof msg === 'string' && msg.trim()) return acortar(msg, 300)
    if (status === 409) return 'La incidencia fue modificada por otra persona. Se cargó la versión más reciente.'
    if (status === 413) return 'El archivo es demasiado grande.'
    if (status === 429) return 'Demasiadas solicitudes. Espera un momento e intenta de nuevo.'
    if (status === 404) return 'No se encontró el recurso solicitado.'
    if (status === 403) return 'No tienes permiso para realizar esta acción.'
    if (status >= 500) return 'Servicio no disponible. Intenta más tarde.'
  }
  return 'Ocurrió un error inesperado.'
}

/** Código HTTP del error (si lo hubo). */
export const estadoHttp = (e: unknown): number | undefined => (axios.isAxiosError(e) ? e.response?.status : undefined)
