import { api } from '@/core/http/cliente'
import type { Paginado } from '@/core/types/api'
import { normalizarIncidencia } from './normalizar'
import type {
  FiltrosIncidencias,
  Incidencia,
  IncidenciaResumen,
  NuevaIncidencia,
} from '../types/incidencia.types'

/** POST /api/incidencias — Root, Rep. Devuelve el expediente (con el folio generado). */
export const crear = async (datos: NuevaIncidencia) =>
  normalizarIncidencia(await api.post<Incidencia>('/api/incidencias', datos))

/** Solo manda al backend los filtros que tienen valor. */
function paramsDe(f: FiltrosIncidencias) {
  const p: Record<string, string | number | boolean> = { pagina: f.pagina, tamanoPagina: f.tamanoPagina }
  if (f.estado) p.estado = f.estado
  if (f.prioridad) p.prioridad = f.prioridad
  if (f.categoria) p.categoria = f.categoria
  if (f.edificio) p.edificio = f.edificio
  if (f.asignada) p.asignada = f.asignada
  if (f.tag) p.tag = f.tag
  if (f.conProveedorExterno) p.conProveedorExterno = true
  if (f.fechaDesde) p.fechaDesde = f.fechaDesde
  if (f.fechaHasta) p.fechaHasta = f.fechaHasta
  return p
}

/**
 * GET /api/incidencias — todos los roles (Rep ve solo las suyas, Téc solo las asignadas:
 * lo filtra el backend). Más recientes primero.
 */
export const listar = (filtros: FiltrosIncidencias) =>
  api.get<Paginado<IncidenciaResumen>>('/api/incidencias', { params: paramsDe(filtros) })

/** GET /api/incidencias/tags-sugeridos?busqueda= — para autocompletar (alfabético). */
export const tagsSugeridos = (busqueda = '') =>
  api.get<string[]>('/api/incidencias/tags-sugeridos', {
    params: busqueda ? { busqueda } : undefined,
  })

/**
 * GET /api/incidencias/{id} — expediente completo (Rep: solo la suya, Téc: solo la asignada).
 * El 403 y el 404 los muestra la propia pantalla, por eso `sinAviso`.
 */
export const obtener = async (id: string) =>
  normalizarIncidencia(await api.get<Incidencia>(`/api/incidencias/${encodeURIComponent(id)}`, { sinAviso: true }))

/** Total de incidencias (opcionalmente solo las sin asignar) para los contadores del menú. Llamada silenciosa. */
export const contar = async (sinAsignar = false): Promise<number> => {
  const r = await api.get<Paginado<unknown>>('/api/incidencias', {
    params: { pagina: 1, tamanoPagina: 1, ...(sinAsignar ? { asignada: 'false' } : {}) },
    sinAviso: true,
  })
  return Number(r?.total ?? 0)
}
