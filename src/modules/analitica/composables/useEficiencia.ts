import { ref, watch } from 'vue'
import { useRoute, type LocationQuery } from 'vue-router'
import { mensajeError } from '@/core/http/errores'
import { conPatron, texto } from '@/core/utils/query'
import { eficienciaGlobal } from '../api/analitica.api'
import {
  FILTROS_EFICIENCIA_VACIOS,
  type Eficiencia,
  type FiltrosEficiencia,
} from '../types/analitica.types'
import { useFiltrosUrl } from './useFiltrosUrl'

const FECHA = /^\d{4}-\d{2}-\d{2}$/

function desdeQuery(q: LocationQuery): FiltrosEficiencia {
  return {
    fechaDesde: conPatron(q.fechaDesde, FECHA),
    fechaHasta: conPatron(q.fechaHasta, FECHA),
    categoria: texto(q.categoria),
    edificio: texto(q.edificio),
  }
}

/** Eficiencia global (GET /api/analitica/eficiencia-global). */
export function useEficiencia() {
  const route = useRoute()
  const { filtros, hayFiltros, aplicar, limpiar } = useFiltrosUrl(FILTROS_EFICIENCIA_VACIOS, desdeQuery)

  const datos = ref<Eficiencia | null>(null)
  const cargando = ref(false)
  const error = ref('')
  let ultimaPeticion = 0

  async function cargar() {
    const id = ++ultimaPeticion
    cargando.value = true
    error.value = ''
    try {
      const r = await eficienciaGlobal(filtros.value)
      if (id === ultimaPeticion) datos.value = r
    } catch (e) {
      if (id !== ultimaPeticion) return
      datos.value = null
      error.value = mensajeError(e)
    } finally {
      if (id === ultimaPeticion) cargando.value = false
    }
  }

  watch(
    () => JSON.stringify(route.query),
    () => {
      if (route.name === 'eficiencia') void cargar()
    },
    { immediate: true },
  )

  return { filtros, hayFiltros, datos, cargando, error, aplicar, limpiar, recargar: cargar }
}
