import { ref } from 'vue'
import { acortar } from '@/core/utils/validacion'

export type Severidad = 'success' | 'error' | 'warn' | 'info'

export interface Aviso {
  id: number
  severidad: Severidad
  titulo: string
  detalle?: string
}

/** Cola de avisos: `AvisoCentral` (en App.vue) muestra el primero en un recuadro al centro de la pantalla. */
export const cola = ref<Aviso[]>([])
let siguiente = 1

/**
 * ÚNICA forma de avisar al usuario (éxito, error, advertencia o información): todos los avisos
 * salen en el mismo recuadro centrado. Los textos largos (folios, nombres, mensajes del servidor)
 * se acortan para que no desborden. Si ya hay uno idéntico esperando, no se repite.
 */
export function aviso(severidad: Severidad, titulo: string, detalle?: string) {
  const nuevo = { severidad, titulo: acortar(titulo, 80), detalle: detalle ? acortar(detalle, 300) : undefined }
  if (cola.value.some((a) => a.severidad === nuevo.severidad && a.titulo === nuevo.titulo && a.detalle === nuevo.detalle)) return
  cola.value.push({ id: siguiente++, ...nuevo })
}

/** Cierra el aviso que se está mostrando (pasa al siguiente, si hay). */
export const cerrarAviso = () => {
  cola.value.shift()
}
