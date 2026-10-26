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

/** PATCH .../cambiar-estado — `motivo` obligatorio (5–500). */
export const cambiarEstado = (id: string, estado: Estado, motivo: string) =>
  api.patch<unknown>(`${base(id)}/cambiar-estado`, { estado, motivo })

/** PATCH .../seguimiento — nota de 3–2000. Devuelve la entrada de bitácora creada. */
export const agregarNota = (id: string, nota: string) => api.patch<Seguimiento>(`${base(id)}/seguimiento`, { nota })

/** PATCH .../horas-invertidas — de 0.25 a 24 horas (se suman). `comentario` opcional (máx. 300). */
export const registrarHoras = (id: string, horas: number, comentario?: string) =>
  api.patch<RespuestaHoras>(`${base(id)}/horas-invertidas`, comentario ? { horas, comentario } : { horas })

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
