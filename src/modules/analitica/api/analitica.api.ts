import { api } from '@/core/http/cliente'
import { normalizarTiempo } from '@/core/types/tiempo'
import type { Paginado } from '@/core/types/api'
import type { FiltrosIncidencias, IncidenciaResumen } from '@/modules/incidencias/types/incidencia.types'
import type {
  Eficiencia,
  FiltrosEficiencia,
  FiltrosTiempos,
  TiempoEdificio,
} from '../types/analitica.types'

/** Solo manda los filtros que tienen valor. */
function sinVacios<T extends object>(obj: T): Record<string, string | number | boolean | string[]> {
  const p: Record<string, string | number | boolean | string[]> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (Array.isArray(v)) {
      if (v.length) p[k] = v
    } else if (v !== '' && v !== null && v !== undefined && v !== false) p[k] = v as never
  }
  return p
}

/** Los arrays van repetidos (`estado=resuelta&estado=cerrada`), no como `estado[]=…`. */
const REPETIDOS = { indexes: null } as const

/**
 * GET /api/incidencias/buscar — Root, Sop, Dir. Búsqueda de texto en título y descripción,
 * de la más relevante a la menos. `q`: 2–100 caracteres; `"frase exacta"`, `-excluir`.
 * Acepta todos los filtros del listado y cada fila trae además `relevancia`.
 */
export const buscar = (q: string, filtros: FiltrosIncidencias) =>
  api.get<Paginado<IncidenciaResumen>>('/api/incidencias/buscar', { params: { q, ...sinVacios(filtros) } })

/** GET /api/analitica/tiempos-edificio — Root, Dir. Solo cubre los últimos 60 días. */
export const tiemposEdificio = async (filtros: FiltrosTiempos): Promise<TiempoEdificio[]> => {
  const r = await api.get<TiempoEdificio[]>('/api/analitica/tiempos-edificio', { params: sinVacios(filtros) })
  return Array.isArray(r)
    ? r.map((d) => ({
        ...d,
        tiempoPromedio: normalizarTiempo(d.tiempoPromedio),
        tiempoMinimo: normalizarTiempo(d.tiempoMinimo),
        tiempoMaximo: normalizarTiempo(d.tiempoMaximo),
        tiempoTrabajado: normalizarTiempo(d.tiempoTrabajado),
      }))
    : []
}

/** GET /api/analitica/eficiencia-global — Root, Adm. Con valores por defecto si el backend omite algo. */
export async function eficienciaGlobal(filtros: FiltrosEficiencia): Promise<Eficiencia> {
  const r = await api.get<Partial<Eficiencia>>('/api/analitica/eficiencia-global', { params: sinVacios(filtros), paramsSerializer: REPETIDOS })
  const n = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0)
  return {
    totalIncidencias: n(r?.totalIncidencias),
    tiempoHombreTotal: normalizarTiempo(r?.tiempoHombreTotal),
    incidenciasConHoras: n(r?.incidenciasConHoras),
    promedioPorIncidencia: normalizarTiempo(r?.promedioPorIncidencia),
    topTags: Array.isArray(r?.topTags) ? r.topTags : [],
    proveedoresExternos: {
      totalCasos: n(r?.proveedoresExternos?.totalCasos),
      porcentaje: n(r?.proveedoresExternos?.porcentaje),
      porEmpresa: Array.isArray(r?.proveedoresExternos?.porEmpresa) ? r.proveedoresExternos.porEmpresa : [],
    },
  }
}
