import type { Router } from 'vue-router'
import { INICIO_POR_ROL, type Rol } from '@/core/auth/permisos'

/** Pantalla de inicio del rol; si esa ruta aún no existe, cae en "/". */
export function rutaInicio(router: Router, rol: Rol | null): string {
  const destino = rol ? INICIO_POR_ROL[rol] : '/'
  const path = destino.split('?')[0]
  return router.getRoutes().some((r) => r.path === path) ? destino : '/'
}
