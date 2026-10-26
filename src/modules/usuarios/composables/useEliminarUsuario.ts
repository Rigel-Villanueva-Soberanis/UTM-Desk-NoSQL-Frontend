import { aviso } from '@/core/http/avisos'
import { mensajeError } from '@/core/http/errores'
import { acortar } from '@/core/utils/validacion'
import { useConfirmarEliminacion } from '@/shared/composables/useConfirmarEliminacion'
import { eliminar } from '../api/usuarios.api'

/**
 * "Eliminar" de un usuario (DELETE /api/Usuario/{id}): pide confirmación con el ConfirmDialog
 * de la aplicación y, si se acepta, borra de forma permanente. `despues` se llama al terminar bien.
 */
export function useEliminarUsuario() {
  const { confirmar } = useConfirmarEliminacion()

  function pedir(u: { id: string; nombreCompleto: string }, despues: () => void) {
    confirmar({
      que: `al usuario «${acortar(u.nombreCompleto, 60)}»`,
      detalle: 'Se borra de forma permanente y no se puede deshacer.',
      alAceptar: async () => {
        try {
          await eliminar(u.id)
          aviso('success', 'Usuario eliminado', acortar(u.nombreCompleto, 60))
          despues()
        } catch (e) {
          // 409/403 ya los avisó el interceptor; el resto se muestra aquí.
          aviso('error', 'No se pudo eliminar', mensajeError(e))
          despues() // por si cambió algo (p. ej. ya no existía): se refresca la pantalla
        }
      },
    })
  }

  return { pedir }
}
