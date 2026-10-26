import { api } from '@/core/http/cliente'

/** Body de PUT /api/Usuario/mi-perfil. */
export interface MiPerfil {
  nombres: string
  apellidoPaterno: string
  apellidoMaterno?: string
  correo: string
}

/**
 * Lo que devuelve GET /api/Usuario/mi-perfil (dentro de `data`): el mismo usuario de GET /api/Usuario/{id}
 * (id, usuario, estadoCuenta, rolSistema, clasificacionRol, fechaCreacion…). La pantalla solo usa estos campos.
 */
export interface PerfilServidor {
  nombres?: string
  apellidoPaterno?: string
  apellidoMaterno?: string | null
  nombreCompleto?: string
  correo?: string
  usuario?: string
  estadoCuenta?: string
  rolSistema?: string
  clasificacionRol?: string | null
  fechaCreacion?: string
}

/** GET /api/Usuario/mi-perfil — datos actuales de quien tiene la sesión. Si falla, la pantalla usa lo guardado al iniciar sesión. */
export const obtenerPerfil = () => api.get<PerfilServidor>('/api/Usuario/mi-perfil', { sinAviso: true })

/** PUT /api/Usuario/mi-perfil — cualquier rol edita su propio nombre y correo. */
export const actualizarPerfil = (datos: MiPerfil) => api.put<{ nombreCompleto?: string } | null>('/api/Usuario/mi-perfil', datos)

/**
 * PATCH /api/Usuario/mi-password.
 * Un 401 aquí es "contraseña actual incorrecta", no sesión vencida (el interceptor ya no cierra sesión en esta ruta).
 */
export const cambiarPassword = (passwordActual: string, nuevaPassword: string) =>
  api.patch<unknown>('/api/Usuario/mi-password', { passwordActual, nuevaPassword })
