import { api } from '@/core/http/cliente'
import type { Paginado } from '@/core/types/api'
import type {
  EdicionUsuario,
  FiltrosUsuarios,
  NuevoUsuario,
  TecnicoDisponible,
  Usuario,
} from '../types/usuario.types'

/**
 * GET /api/Usuario/tecnicos — Root, Sop, Adm. Para el selector de "Asignar técnico".
 * Ya viene ordenado de menor a mayor carga.
 */
export const tecnicos = async (): Promise<TecnicoDisponible[]> => {
  const lista = await api.get<TecnicoDisponible[]>('/api/Usuario/tecnicos')
  return Array.isArray(lista) ? lista : []
}

// ── Administración de usuarios (solo Soporte de TI, Paso 11.1) ──

const base = (id: string) => `/api/Usuario/${encodeURIComponent(id)}`

/** GET /api/Usuario — paginado (máx. 50 por página). Solo manda los filtros con valor. */
export function listar(f: FiltrosUsuarios) {
  const params: Record<string, string | number> = { pagina: f.pagina, tamanoPagina: f.tamanoPagina }
  for (const k of ['busqueda', 'nombres', 'apellidos', 'rol', 'clasificacion', 'estadoCuenta'] as const)
    if (f[k]) params[k] = f[k]
  return api.get<Paginado<Usuario>>('/api/Usuario', { params })
}

/** GET /api/Usuario/{id} — el 404 lo muestra la propia pantalla. */
export const obtener = (id: string) => api.get<Usuario>(base(id), { sinAviso: true })

/** POST /api/Usuario → 201 con el usuario creado. El formulario muestra su propio aviso de error. */
export const crear = (datos: NuevoUsuario) => api.post<Usuario>('/api/Usuario', datos, { sinAviso: true })

/** PUT /api/Usuario/{id} — el formulario muestra su propio aviso de error. */
export const actualizar = (id: string, datos: EdicionUsuario) => api.put<Usuario>(base(id), datos, { sinAviso: true })

/** PATCH /api/Usuario/{id}/password — restablece la contraseña (mínimo 8). */
export const restablecerPassword = (id: string, nuevaPassword: string) =>
  api.patch<unknown>(`${base(id)}/password`, { nuevaPassword })

/** DELETE /api/Usuario/{id} — borrado permanente. */
export const eliminar = (id: string) => api.delete<unknown>(base(id))
