import { computed, ref, watch } from 'vue'
import { useRoute, useRouter, type LocationQuery } from 'vue-router'
import { usePermisos } from '@/core/auth/usePermisos'
import { mensajeError } from '@/core/http/errores'
import type { Paginado } from '@/core/types/api'
import { aQuery, booleano, conPatron, entero, texto, unoDe } from '@/core/utils/query'
import { listar } from '../../api/incidencias.api'
import {
  FILTROS_VACIOS,
  type FiltrosIncidencias,
  type IncidenciaResumen,
} from '../../types/incidencia.types'

const FECHA = /^\d{4}-\d{2}-\d{2}$/

/** URL → filtros (con valores saneados: una URL escrita a mano no rompe nada). */
export function desdeQuery(q: LocationQuery): FiltrosIncidencias {
  return {
    pagina: entero(q.pagina, 1),
    tamanoPagina: entero(q.tamanoPagina, FILTROS_VACIOS.tamanoPagina, 1, 50),
    estado: texto(q.estado),
    prioridad: texto(q.prioridad),
    categoria: texto(q.categoria),
    edificio: texto(q.edificio),
    asignada: unoDe(q.asignada, ['true', 'false'] as const),
    tag: texto(q.tag),
    conProveedorExterno: booleano(q.conProveedorExterno),
    fechaDesde: conPatron(q.fechaDesde, FECHA),
    fechaHasta: conPatron(q.fechaHasta, FECHA),
  }
}

/**
 * Listado de incidencias. La URL es la fuente de la verdad: filtros y página viven en el
 * query string, así que recargar, compartir el enlace o usar "atrás" conservan todo.
 */
export function useListadoIncidencias(opciones: { ruta?: string; fijos?: Partial<FiltrosIncidencias> } = {}) {
  const nombreRuta = opciones.ruta ?? 'incidencias'
  const fijos = opciones.fijos ?? {}
  const route = useRoute()
  const router = useRouter()
  const { rol } = usePermisos()

  /** Filtros de la URL + los que la pantalla impone (p. ej. la bandeja siempre es `asignada=false`). */
  const filtros = computed<FiltrosIncidencias>(() => ({ ...desdeQuery(route.query), ...fijos }))
  const datos = ref<Paginado<IncidenciaResumen> | null>(null)
  const cargando = ref(false)
  const error = ref('')
  let ultimaPeticion = 0

  /** Misma pantalla, otro título según el rol (el backend ya filtra qué ve cada uno). */
  const titulo = computed(() =>
    rol.value === 'reportante' ? 'Mis reportes' : rol.value === 'tecnico' ? 'Mi mesa de trabajo' : 'Incidencias',
  )
  const descripcion = computed(() =>
    rol.value === 'reportante'
      ? 'Las incidencias que has reportado.'
      : rol.value === 'tecnico'
        ? 'Las incidencias que tienes asignadas.'
        : 'Todas las incidencias del sistema.',
  )

  const hayFiltros = computed(() => {
    const f = filtros.value
    return !!(f.estado || f.prioridad || f.categoria || f.edificio || (!('asignada' in fijos) && f.asignada) || f.tag ||
      f.conProveedorExterno || f.fechaDesde || f.fechaHasta)
  })

  async function cargar() {
    const id = ++ultimaPeticion
    cargando.value = true
    error.value = ''
    try {
      const r = await listar(filtros.value)
      if (id !== ultimaPeticion) return // llegó una respuesta vieja
      datos.value = r
      // Página fuera de rango (p. ej. se borraron incidencias): vuelve a la última que existe.
      if (!r.items.length && r.total > 0 && filtros.value.pagina > r.totalPaginas)
        await irAPagina(r.totalPaginas, filtros.value.tamanoPagina, true)
    } catch (e) {
      if (id !== ultimaPeticion) return
      datos.value = null
      error.value = mensajeError(e)
    } finally {
      if (id === ultimaPeticion) cargando.value = false
    }
  }

  // Cada cambio en la URL vuelve a pedir los datos (solo mientras esta pantalla está activa).
  watch(
    () => JSON.stringify(route.query),
    () => {
      if (route.name === nombreRuta) void cargar()
    },
    { immediate: true },
  )

  function navegar(nuevos: FiltrosIncidencias, reemplazar = false) {
    // En la URL primero van los filtros y al final la paginación: ?estado=abierta&pagina=2
    const { pagina, tamanoPagina, ...filtrosSolos } = { ...nuevos, ...Object.fromEntries(Object.keys(fijos).map((k) => [k, FILTROS_VACIOS[k as keyof FiltrosIncidencias]])) } as FiltrosIncidencias
    const destino = { query: aQuery({ ...filtrosSolos, pagina, tamanoPagina }, FILTROS_VACIOS) }
    return reemplazar ? router.replace(destino) : router.push(destino)
  }

  /** Cambia uno o más filtros; al filtrar siempre se vuelve a la página 1. */
  function aplicarFiltros(parcial: Partial<FiltrosIncidencias>) {
    return navegar({ ...filtros.value, ...parcial, pagina: 1 })
  }

  function irAPagina(pagina: number, tamanoPagina = filtros.value.tamanoPagina, reemplazar = false) {
    return navegar({ ...filtros.value, pagina, tamanoPagina }, reemplazar)
  }

  /** Quita todos los filtros (conserva cuántas filas por página eligió). */
  function limpiar() {
    return navegar({ ...FILTROS_VACIOS, tamanoPagina: filtros.value.tamanoPagina })
  }

  return {
    filtros,
    datos,
    cargando,
    error,
    titulo,
    descripcion,
    hayFiltros,
    aplicarFiltros,
    irAPagina,
    limpiar,
    recargar: cargar,
  }
}
