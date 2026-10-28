import type { Tiempo } from '@/core/types/tiempo'
import type { Estado, Prioridad } from '@/modules/incidencias/types/incidencia.types'

/** Fila de GET /api/analitica/tiempos-edificio. */
export interface TiempoEdificio {
  edificio: string
  totalReportes: number
  tiempoPromedio: Tiempo
  tiempoMinimo: Tiempo
  tiempoMaximo: Tiempo
  /** Suma de las horas registradas por los técnicos en ese edificio. */
  tiempoTrabajado: Tiempo
}

export type OrdenTiempos = 'reportes' | 'tiempo'

/** Filtros de Tiempos (los mismos nombres que el query string del backend y de la URL). */
export interface FiltrosTiempos {
  /** Fecha de RESOLUCIÓN, AAAA-MM-DD. */
  fechaDesde: string
  fechaHasta: string
  categoria: string
  prioridad: '' | Prioridad
  ordenarPor: OrdenTiempos
}

export const FILTROS_TIEMPOS_VACIOS: FiltrosTiempos = {
  fechaDesde: '',
  fechaHasta: '',
  categoria: '',
  prioridad: '',
  ordenarPor: 'reportes',
}

/** Data de GET /api/analitica/eficiencia-global. */
export interface Eficiencia {
  totalIncidencias: number
  tiempoHombreTotal: Tiempo
  incidenciasConHoras: number
  promedioPorIncidencia: Tiempo
  topTags: { tag: string; total: number }[]
  proveedoresExternos: {
    totalCasos: number
    porcentaje: number
    porEmpresa: { empresa: string; total: number }[]
  }
}

/** Filtros de Eficiencia. */
export interface FiltrosEficiencia {
  /** Fecha de CREACIÓN, AAAA-MM-DD. */
  fechaDesde: string
  fechaHasta: string
  categoria: string
  edificio: string
  /** Varios estados; vacío = todos (no se manda `estado`). */
  estado: Estado[]
}

export const FILTROS_EFICIENCIA_VACIOS: FiltrosEficiencia = {
  fechaDesde: '',
  fechaHasta: '',
  categoria: '',
  edificio: '',
  estado: [],
}
