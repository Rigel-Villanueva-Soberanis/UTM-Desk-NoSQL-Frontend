import { ref } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'

/**
 * Desde qué pantalla se llegó al expediente de una incidencia (Incidencias, Bandeja o Búsqueda).
 * El menú lo usa para seguir marcando esa opción mientras se ve el detalle, en vez de saltar siempre a «Incidencias».
 * Se guarda en sessionStorage para que recargar la página no lo pierda.
 */
const CLAVE = 'utmdesk.origenExpediente'
const DESDE: Record<string, string> = { incidencias: '/incidencias', bandeja: '/bandeja', busqueda: '/busqueda' }

function leer(): string | null {
  try {
    return sessionStorage.getItem(CLAVE)
  } catch {
    return null
  }
}
function guardar(v: string | null) {
  try {
    if (v) sessionStorage.setItem(CLAVE, v)
    else sessionStorage.removeItem(CLAVE)
  } catch {
    /* sin almacenamiento: solo se pierde al recargar */
  }
}

/** Ruta del menú que dio origen al expediente actual (`null` = ninguna conocida → «Incidencias»). */
export const origenExpediente = ref<string | null>(leer())

/** Se llama en cada navegación: recuerda de dónde se vino al abrir un expediente. */
export function registrarOrigen(to: RouteLocationNormalized, from: RouteLocationNormalized) {
  if (to.name !== 'expediente') return
  const desde = typeof from.name === 'string' ? DESDE[from.name] : undefined
  if (desde) {
    origenExpediente.value = desde
    guardar(desde)
  } else if (from.name !== 'expediente' && from.name !== undefined) {
    // Se llegó de otra parte (p. ej. al reportar una falla): el expediente cuelga de «Incidencias».
    origenExpediente.value = null
    guardar(null)
  }
}
