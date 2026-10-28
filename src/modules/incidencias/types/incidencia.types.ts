import type { Tiempo } from '@/core/types/tiempo'
export type Estado = 'abierta' | 'en proceso' | 'en espera' | 'resuelta' | 'cerrada' | 'cancelada'
export type Prioridad = 'baja' | 'media' | 'alta' | 'critica'

export const PRIORIDADES: { valor: Prioridad; etiqueta: string }[] = [
  { valor: 'baja', etiqueta: 'Baja' },
  { valor: 'media', etiqueta: 'Media' },
  { valor: 'alta', etiqueta: 'Alta' },
  { valor: 'critica', etiqueta: 'Crítica' },
]

/** Valores de `detalleEspecifico`: una entrada por cada campo dinámico de la categoría. */
export type DetalleEspecifico = Record<string, string | number>

/** Body de POST /api/incidencias. */
export interface NuevaIncidencia {
  titulo: string
  descripcion: string
  categoria: string
  claveEdificio: string
  salon: string
  prioridad?: Prioridad
  detalleEspecifico: DetalleEspecifico
}

/** Respuesta de POST /api/evidencias/upload (un elemento por archivo). */
export interface EvidenciaSubida {
  publicId: string
  nombreArchivo: string
  formato: string
  bytes: number
  tipoMime?: string
  pesoKb?: number
  /** URL firmada que caduca (ver `venceEn`). */
  urlTemporal?: string
  venceEn?: string
}

/** Lo que pide PATCH /api/incidencias/{id}/evidencias. */
export interface EvidenciaLigar {
  publicId: string
  formato: string
  nombreArchivo: string
}

export interface ActorRef {
  idUsuario: string
  nombre: string
  rol?: string
  perfil?: string
}

export type TipoSeguimiento =
  | 'creacion'
  | 'evidencia'
  | 'asignacion'
  | 'reasignacion'
  | 'cambio_estado'
  | 'nota'
  | 'horas'
  | 'etiquetas'
  | 'servicio_externo'
  | 'edicion'

export interface Seguimiento {
  tipo: TipoSeguimiento
  autor: ActorRef
  accion: string
  estadoAnterior: Estado | null
  estadoReportado: Estado | null
  fecha: string
}

export interface EvidenciaAdjunta {
  nombreArchivo: string
  /** Antes la URL fija; ahora el backend manda `urlTemporal` (firmada, con vencimiento en `venceEn`). Se acepta cualquiera. */
  urlStorage?: string
  urlTemporal?: string
  venceEn?: string
  tipoMime?: string
  pesoKb?: number
  publicId: string
  formato: string
  subidoPor: ActorRef
  fechaCarga: string
}

/** URL con la que se muestra una evidencia. */
export const urlEvidencia = (e: Pick<EvidenciaAdjunta, 'urlTemporal' | 'urlStorage'>) => e.urlTemporal ?? e.urlStorage ?? ''

export interface TecnicoExterno {
  requiereServicioExterno: boolean
  empresaProveedor: string
  nombreTecnico: string | null
  contacto: string | null
  ordenServicioRef: string
}

/** Expediente completo (GET /api/incidencias/{id}); también lo devuelven crear y las acciones. */
export interface Incidencia {
  id: string
  folio: string
  titulo: string
  descripcion: string
  categoria: string
  detalleEspecifico: DetalleEspecifico
  estado: Estado
  prioridad: Prioridad
  ubicacion: { clave: string; edificio: string; aula: string }
  datosReportante: ActorRef
  tecnicoAsignado: ActorRef | null
  tecnicoExterno: TecnicoExterno | null
  tiempoInvertido: Tiempo
  tags: string[]
  historialSeguimiento: Seguimiento[]
  evidenciasAdjuntas: EvidenciaAdjunta[]
  fechas: { creacion: string; resolucion: string | null }
}

/** Fila del listado (GET /api/incidencias → `items`). */
export interface IncidenciaResumen {
  id: string
  folio: string
  titulo: string
  categoria: string
  estado: Estado
  prioridad: Prioridad
  edificio: string
  aula: string
  nombreReportante: string
  asignada: boolean
  idTecnico: string | null
  nombreTecnico: string | null
  fechaCreacion: string
  /** Solo en la búsqueda (GET /api/incidencias/buscar): mientras más alto, más relevante. */
  relevancia?: number
}

export const ESTADOS: { valor: Estado; etiqueta: string }[] = [
  { valor: 'abierta', etiqueta: 'Abierta' },
  { valor: 'en proceso', etiqueta: 'En proceso' },
  { valor: 'en espera', etiqueta: 'En espera' },
  { valor: 'resuelta', etiqueta: 'Resuelta' },
  { valor: 'cerrada', etiqueta: 'Cerrada' },
  { valor: 'cancelada', etiqueta: 'Cancelada' },
]

/**
 * Filtros del listado. Los nombres son los mismos del query string del backend y de la URL.
 * Vacío ('') = sin filtrar. `asignada`: 'true' con técnico, 'false' sin asignar (bandeja).
 */
export interface FiltrosIncidencias {
  pagina: number
  tamanoPagina: number
  estado: string
  prioridad: string
  categoria: string
  edificio: string
  asignada: '' | 'true' | 'false'
  tag: string
  conProveedorExterno: boolean
  /** AAAA-MM-DD (día de hora de México, ambos incluidos). */
  fechaDesde: string
  fechaHasta: string
}

export { TAMANOS_PAGINA } from '@/shared/config/paginador' // el backend permite máximo 50
export const FILTROS_VACIOS: FiltrosIncidencias = {
  pagina: 1,
  tamanoPagina: 10,
  estado: '',
  prioridad: '',
  categoria: '',
  edificio: '',
  asignada: '',
  tag: '',
  conProveedorExterno: false,
  fechaDesde: '',
  fechaHasta: '',
}

/** Acciones del expediente (cada una abre un diálogo en el Paso 8). */
export type Accion =
  | 'asignar'
  | 'estado'
  | 'nota'
  | 'horas'
  | 'evidencia'
  | 'etiquetas'
  | 'externo'
  | 'editar'
  | 'eliminar'
  /** Atajo del técnico: abre «Cambiar estado» ya con «resuelta» elegida. */
  | 'resolver'
  /** Verificación final (Root, Soporte, Administrativos): pasa una incidencia `resuelta` a `cerrada`. */
  | 'cerrar'

/** Respuesta de PATCH .../horas-invertidas. */
export interface RespuestaHoras {
  tiempoRegistrado: Tiempo
  tiempoTotal: Tiempo
  seguimiento: Seguimiento
}

/** Respuesta de DELETE /api/incidencias/{id}. */
export interface RespuestaEliminar {
  id: string
  folio: string
  archivosEliminados: number
}

/** Body de PATCH .../tecnico-externo. */
export interface DatosExterno {
  empresa: string
  /** Opcionales: si van vacíos no se mandan. */
  tecnicoResponsable?: string
  contacto?: string
  ordenServicio: string
}

/** Body de PATCH .../tags. */
export interface CambioTags {
  agregar: string[]
  quitar: string[]
}

/** Body de PUT /api/incidencias/{id} (no cambia categoría, prioridad ni estado). */
export interface EdicionIncidencia {
  titulo: string
  descripcion: string
  claveEdificio: string
  salon: string
  detalleEspecifico: DetalleEspecifico
}
