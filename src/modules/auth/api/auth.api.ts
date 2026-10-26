import { api } from '@/core/http/cliente'
import type { RespuestaLogin } from '@/core/auth/sesion.store'

/** POST /api/Auth/login (público). */
export const login = (usuario: string, password: string) =>
  api.post<RespuestaLogin>('/api/Auth/login', { usuario, password })
