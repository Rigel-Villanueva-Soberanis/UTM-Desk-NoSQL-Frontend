import { api } from '@/core/http/cliente'
import { normalizarIncidencia } from './normalizar'
import type {
  CambioTags,
  DatosExterno,
  EdicionIncidencia,
  Estado,
  Incidencia,
  RespuestaEliminar,
  RespuestaHoras,
  Seguimiento,
} from '../types/incidencia.types'

const base = (id: string) => `/api/incidencias/${encodeURIComponent(id)}`

/**
 * PATCH .../asignar-tecnico — Root, Sop, Adm. Si estaba `abierta` pasa sola a `en proceso`.
 * 400 si no es técnico o está inactivo · 409 si ya es el mismo o la incidencia está cerrada.
 */
export const asignarTecnico = async (id: string, idTecnico: string) =>
  normalizarIncidencia(await api.patch<Incidencia>(`${base(id)}/asignar-tecnico`, { idTecnico }))

/**
 * PATCH .../cambiar-estado — `motivo` obligatorio (5–500). `horas`/`minutos` son opcionales y solo los
 * acepta el técnico asignado o Root (otro rol → 403; más de 24 h → 400). `cerrada` solo desde `resuelta` (409).
 */
export const cambiarEstado = (id: string, estado: Estado, motivo: string, tiempo?: { horas: number; minutos: number }) =>
  api.patch<unknown>(`${base(id)}/cambiar-estado`, tiempo ? { estado, motivo, horas: tiempo.horas, minutos: tiempo.minutos } : { estado, motivo })

/** PATCH .../seguimiento — nota de 3–2000. Devuelve la entrada de bitácora creada. */
export const agregarNota = (id: string, nota: string) => api.patch<Seguimiento>(`${base(id)}/seguimiento`, { nota })

/** PATCH .../horas-invertidas — `horas` (0–24) y `minutos` (0–59) enteros; de 1 min a 24 h por registro (se suman). `comentario` opcional (máx. 300). */
export const registrarHoras = (id: string, horas: number, minutos: number, comentario?: string) =>
  api.patch<RespuestaHoras>(`${base(id)}/horas-invertidas`, comentario ? { horas, minutos, comentario } : { horas, minutos })

/** PATCH .../tags — devuelve la lista final de etiquetas de la incidencia. */
export const cambiarTags = (id: string, cambio: CambioTags) => api.patch<string[]>(`${base(id)}/tags`, cambio)

/** PATCH .../tecnico-externo — reemplaza al proveedor anterior, si había. */
export const asignarExterno = async (id: string, datos: DatosExterno) =>
  normalizarIncidencia(await api.patch<Incidencia>(`${base(id)}/tecnico-externo`, datos))

/** PUT /api/incidencias/{id} — corrige la captura (no cambia categoría, prioridad ni estado). */
export const editar = async (id: string, datos: EdicionIncidencia) =>
  normalizarIncidencia(await api.put<Incidencia>(base(id), datos))

/** DELETE /api/incidencias/{id} — borra evidencias y documento. No se puede deshacer. 503 si Cloudinary falla. */
export const eliminar = (id: string) => api.delete<RespuestaEliminar>(base(id))
