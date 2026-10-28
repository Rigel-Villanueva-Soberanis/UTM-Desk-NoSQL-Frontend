import type { Router } from 'vue-router'
import { useSesionStore } from '@/core/auth/sesion.store'
import { puede } from '@/core/auth/permisos'
import { registrarOrigen } from './origen'
import { rutaInicio } from './inicio'

export function instalarGuard(router: Router) {
  router.beforeEach((to, from) => {
    const sesion = useSesionStore()

    if (to.meta.publica) {
      // Con sesión activa no tiene sentido volver al login.
      if (sesion.autenticado && to.name === 'login') return rutaInicio(router, sesion.rol)
      return true
    }

    if (!sesion.autenticado) {
      sesion.logout()
      return { name: 'login', query: { redirect: to.fullPath } }
    }

    if (to.meta.permiso && !puede(sesion.rol, to.meta.permiso)) return { name: 'sin-permiso' }

    registrarOrigen(to, from)

    // «/» no es una pantalla: se va directo a la de inicio del rol (solo se queda en «/» si esa pantalla no existe).
    if (to.name === 'inicio') {
      const destino = rutaInicio(router, sesion.rol)
      if (destino !== '/') return destino
    }
    return true
  })
}
