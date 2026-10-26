import { computed } from 'vue'
import { useRoute, useRouter, type LocationQuery } from 'vue-router'
import { aQuery } from '@/core/utils/query'

/**
 * Filtros de una pantalla de analítica ↔ URL (la URL es la fuente de la verdad):
 * recargar, compartir el enlace o usar "atrás" conservan los filtros.
 */
export function useFiltrosUrl<T extends object>(defectos: T, leer: (q: LocationQuery) => T) {
  const route = useRoute()
  const router = useRouter()

  const filtros = computed(() => leer(route.query))
  const hayFiltros = computed(() =>
    (Object.keys(defectos) as (keyof T)[]).some((k) => filtros.value[k] !== defectos[k]),
  )

  const aplicar = (parcial: Partial<T>) =>
    router.push({ query: aQuery({ ...filtros.value, ...parcial }, defectos) })
  const limpiar = () => router.push({ query: {} })

  return { filtros, hayFiltros, aplicar, limpiar }
}
