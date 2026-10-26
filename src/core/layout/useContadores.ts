import { ref } from 'vue'
import { contar } from '@/modules/incidencias/api/incidencias.api'

/** Insignias del menú: total de incidencias y cuántas están sin asignar. `null` = aún no se sabe (no se muestra). */
const total = ref<number | null>(null)
const sinAsignar = ref<number | null>(null)
let ultima = 0
let enCurso: Promise<void> | null = null

/**
 * Actualiza los contadores. Es silencioso: si falla, la insignia simplemente no se muestra.
 * Sin `forzar`, no repite la consulta si hace menos de 10 s que se hizo.
 */
export function refrescarContadores(opciones: { total: boolean; sinAsignar: boolean }, forzar = false) {
  if (enCurso) return enCurso
  if (!forzar && Date.now() - ultima < 10_000) return Promise.resolve()
  ultima = Date.now()
  enCurso = Promise.all([
    opciones.total ? contar().then((n) => (total.value = n)).catch(() => (total.value = null)) : null,
    opciones.sinAsignar ? contar(true).then((n) => (sinAsignar.value = n)).catch(() => (sinAsignar.value = null)) : null,
  ]).then(() => undefined).finally(() => {
    enCurso = null
  })
  return enCurso
}

export function reiniciarContadores() {
  total.value = null
  sinAsignar.value = null
  ultima = 0
}

export const useContadores = () => ({ total, sinAsignar })
