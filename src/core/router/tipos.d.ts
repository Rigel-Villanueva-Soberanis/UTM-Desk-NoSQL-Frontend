import 'vue-router'
import type { Permiso } from '@/core/auth/permisos'

declare module 'vue-router' {
  interface RouteMeta {
    /** Ruta accesible sin sesión (login). */
    publica?: boolean
    /** Permiso requerido (ver core/auth/permisos.ts). */
    permiso?: Permiso
    titulo?: string
  }
}
