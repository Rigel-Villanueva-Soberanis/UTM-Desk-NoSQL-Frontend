import { ref, watch } from 'vue'
import { useRoute, type LocationQuery } from 'vue-router'
import { mensajeError } from '@/core/http/errores'
import { conPatron, texto, unoDe } from '@/core/utils/query'
import { PRIORIDADES } from '@/modules/incidencias/types/incidencia.types'
import { tiemposEdificio } from '../api/analitica.api'
import {
  FILTROS_TIEMPOS_VACIOS,
  type FiltrosTiempos,
  type TiempoEdificio,
} from '../types/analitica.types'
import { useFiltrosUrl } from './useFiltrosUrl'

const FECHA = /^\d{4}-\d{2}-\d{2}$/

function desdeQuery(q: LocationQuery): FiltrosTiempos {
  return {
    fechaDesde: conPatron(q.fechaDesde, FECHA),
    fechaHasta: conPatron(q.fechaHasta, FECHA),
    categoria: texto(q.categoria),
    prioridad: unoDe(q.prioridad, PRIORIDADES.map((p) => p.valor)),
    ordenarPor: unoDe(q.ordenarPor, ['reportes', 'tiempo'] as const) || 'reportes',
  }
}

/** Tiempos de resolución por edificio (GET /api/analitica/tiempos-edificio). */
export function useTiempos() {
  const route = useRoute()
  const { filtros, hayFiltros, aplicar, limpiar } = useFiltrosUrl(FILTROS_TIEMPOS_VACIOS, desdeQuery)

  const datos = ref<TiempoEdificio[]>([])
  const cargando = ref(false)
  const error = ref('')
  let ultimaPeticion = 0

  async function cargar() {
    const id = ++ultimaPeticion
    cargando.value = true
    error.value = ''
    try {
      const r = await tiemposEdificio(filtros.value)
      if (id === ultimaPeticion) datos.value = r
    } catch (e) {
      if (id !== ultimaPeticion) return
      datos.value = []
      error.value = mensajeError(e)
    } finally {
      if (id === ultimaPeticion) cargando.value = false
    }
  }

  watch(
    () => JSON.stringify(route.query),
    () => {
      if (route.name === 'tiempos') void cargar()
    },
    { immediate: true },
  )

  return { filtros, hayFiltros, datos, cargando, error, aplicar, limpiar, recargar: cargar }
}
