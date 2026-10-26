import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { aMapa, mensajeError } from '@/core/http/errores'
import type { Paginado } from '@/core/types/api'
import { aQuery, texto } from '@/core/utils/query'
import { limpiarEspacios, sinControl } from '@/core/utils/validacion'
import { desdeQuery } from '@/modules/incidencias/listado/composables/useListadoIncidencias'
import {
  FILTROS_VACIOS,
  type FiltrosIncidencias,
  type IncidenciaResumen,
} from '@/modules/incidencias/types/incidencia.types'
import { buscar } from '../api/analitica.api'

/** Límites de `q` en el backend. */
export const Q_MIN = 2
export const Q_MAX = 100

/**
 * Búsqueda de texto (Paso 10.1). Igual que el listado, la URL manda: `?q=…&estado=…&pagina=…`.
 * Sin una búsqueda válida (2–100 caracteres) no se pide nada al backend.
 */
export function useBusqueda() {
  const route = useRoute()
  const router = useRouter()

  const filtros = computed(() => desdeQuery(route.query))
  /** Lo que se está buscando (de la URL, ya saneado). */
  const q = computed(() => limpiarEspacios(sinControl(texto(route.query.q))).slice(0, Q_MAX))
  const hayBusqueda = computed(() => q.value.length >= Q_MIN)

  const datos = ref<Paginado<IncidenciaResumen> | null>(null)
  const cargando = ref(false)
  const error = ref('')
  /** Error del propio campo de búsqueda (cliente o `errors[q]` del backend). */
  const errorQ = ref('')
  let ultimaPeticion = 0

  const hayFiltros = computed(() => {
    const f = filtros.value
    return !!(f.estado || f.prioridad || f.categoria || f.edificio || f.asignada || f.tag ||
      f.conProveedorExterno || f.fechaDesde || f.fechaHasta)
  })

  async function cargar() {
    const id = ++ultimaPeticion
    error.value = ''
    errorQ.value = ''
    if (!hayBusqueda.value) {
      datos.value = null
      cargando.value = false
      return
    }
    cargando.value = true
    try {
      const r = await buscar(q.value, filtros.value)
      if (id !== ultimaPeticion) return
      datos.value = r
      if (!r.items.length && r.total > 0 && filtros.value.pagina > r.totalPaginas)
        await navegar(q.value, { ...filtros.value, pagina: r.totalPaginas }, true)
    } catch (e) {
      if (id !== ultimaPeticion) return
      datos.value = null
      errorQ.value = aMapa(e).q ?? ''
      error.value = errorQ.value ? '' : mensajeError(e)
    } finally {
      if (id === ultimaPeticion) cargando.value = false
    }
  }

  watch(
    () => JSON.stringify(route.query),
    () => {
      if (route.name === 'busqueda') void cargar()
    },
    { immediate: true },
  )

  function navegar(nuevaQ: string, nuevos: FiltrosIncidencias, reemplazar = false) {
    // En la URL: primero la búsqueda, luego los filtros y al final la paginación.
    const { pagina, tamanoPagina, ...solos } = nuevos
    const destino = { query: aQuery({ q: nuevaQ, ...solos, pagina, tamanoPagina }, { ...FILTROS_VACIOS, q: '' }) }
    return reemplazar ? router.replace(destino) : router.push(destino)
  }

  /** Lanza una búsqueda nueva (vuelve a la página 1). Regresa false si el texto no es válido. */
  function enviar(entrada: string): boolean {
    const v = limpiarEspacios(sinControl(entrada))
    if (v.length < Q_MIN) {
      errorQ.value = `Escribe al menos ${Q_MIN} caracteres para buscar.`
      return false
    }
    if (v.length > Q_MAX) {
      errorQ.value = `La búsqueda no puede tener más de ${Q_MAX} caracteres.`
      return false
    }
    errorQ.value = ''
    void navegar(v, { ...filtros.value, pagina: 1 })
    return true
  }

  const aplicarFiltros = (parcial: Partial<FiltrosIncidencias>) =>
    navegar(q.value, { ...filtros.value, ...parcial, pagina: 1 })
  const irAPagina = (pagina: number, tamanoPagina = filtros.value.tamanoPagina) =>
    navegar(q.value, { ...filtros.value, pagina, tamanoPagina })
  const limpiarFiltros = () => navegar(q.value, { ...FILTROS_VACIOS, tamanoPagina: filtros.value.tamanoPagina })
  /** Quita la búsqueda (y la página) pero conserva los filtros. */
  const limpiarBusqueda = () => navegar('', { ...filtros.value, pagina: 1 })

  return {
    filtros,
    q,
    hayBusqueda,
    hayFiltros,
    datos,
    cargando,
    error,
    errorQ,
    enviar,
    aplicarFiltros,
    irAPagina,
    limpiarFiltros,
    limpiarBusqueda,
    recargar: cargar,
  }
}
