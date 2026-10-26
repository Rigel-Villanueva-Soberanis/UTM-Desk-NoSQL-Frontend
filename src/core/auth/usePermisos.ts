import { storeToRefs } from 'pinia'
import { puede as puedeRol, type Permiso } from './permisos'
import { useSesionStore } from './sesion.store'

/** Para usar en las vistas: `puede('incidencias.asignar')`. */
export function usePermisos() {
  const { rol, usuario } = storeToRefs(useSesionStore())
  const puede = (permiso: Permiso) => puedeRol(rol.value, permiso)
  return { puede, rol, usuario }
}
