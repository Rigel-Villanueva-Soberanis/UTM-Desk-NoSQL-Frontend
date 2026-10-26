import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'
import type { ApiResponse } from '@/core/types/api'
import { useSesionStore } from '@/core/auth/sesion.store'
import router from '@/core/router'
import { aviso } from './avisos'
import { mensajeError } from './errores'

/** Si el servidor no responde en 30 s se corta (las subidas de archivos piden más, ver evidencias.api). */
export const TIMEOUT_MS = 30_000

const instancia = axios.create({ baseURL: import.meta.env.VITE_API_URL, timeout: TIMEOUT_MS })

// El 401 de estas rutas significa "credenciales incorrectas", no "sesión vencida".
const RUTAS_SIN_LOGOUT = ['/Auth/login', '/mi-password']

instancia.interceptors.request.use((config) => {
  const token = useSesionStore().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

instancia.interceptors.response.use(
  (r) => r,
  (error) => {
    const status = error.response?.status as number | undefined
    const url = String(error.config?.url ?? '')

    if (status === 401 && !RUTAS_SIN_LOGOUT.some((r) => url.includes(r))) {
      const sesion = useSesionStore()
      if (sesion.token) {
        sesion.logout()
        aviso('warn', 'Sesión terminada', 'Vuelve a iniciar sesión.')
        const actual = router.currentRoute.value
        router.push({ name: 'login', query: { redirect: actual.fullPath } })
      }
    } else if (error.config?.sinAviso) {
      // llamada silenciosa (p. ej. contadores del menú): sin avisos
    } else if (status === 403) {
      aviso('error', 'Sin permiso', 'No tienes permiso para realizar esta acción.')
    } else if (status === 409) {
      aviso('warn', 'No se pudo completar', mensajeError(error))
    } else if (status === 413 || status === 429) {
      aviso('warn', status === 413 ? 'Archivo demasiado grande' : 'Demasiadas solicitudes', mensajeError(error))
    } else if (!error.response || status === 503) {
      aviso('error', 'Servicio no disponible', mensajeError(error))
    }
    // Siempre se relanza para que el formulario lea `errors`.
    return Promise.reject(error)
  },
)

/** Quita la envoltura { success, data, errors } y regresa solo `data`. */
const datos = async <T>(p: Promise<AxiosResponse<ApiResponse<T>>>): Promise<T> => (await p).data.data

export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) => datos<T>(instancia.get(url, config)),
  post: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    datos<T>(instancia.post(url, body, config)),
  put: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    datos<T>(instancia.put(url, body, config)),
  patch: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    datos<T>(instancia.patch(url, body, config)),
  delete: <T>(url: string, config?: AxiosRequestConfig) => datos<T>(instancia.delete(url, config)),
}
