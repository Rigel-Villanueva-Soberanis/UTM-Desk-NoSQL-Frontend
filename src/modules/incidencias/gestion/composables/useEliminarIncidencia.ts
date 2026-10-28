import { aviso } from '@/core/http/avisos'
import { estadoHttp, mensajeError } from '@/core/http/errores'
import { acortar } from '@/core/utils/validacion'
import { useConfirmarEliminacion } from '@/shared/composables/useConfirmarEliminacion'
import { eliminar } from '../../api/gestion.api'
import type { Incidencia } from '../../types/incidencia.types'

/**
 * «Eliminar» una incidencia (DELETE /api/incidencias/{id}): pide confirmación con el ConfirmDialog de la
 * aplicación (el mismo de los demás borrados) y, si se acepta, la borra junto con sus evidencias.
 * `eliminada` se llama al borrarla; `fallo` si no se pudo (la pantalla se refresca por si cambió algo).
 */
export function useEliminarIncidencia() {
  const { confirmar } = useConfirmarEliminacion()

  function pedir(i: Pick<Incidencia, 'id' | 'folio' | 'evidenciasAdjuntas'>, eliminada: () => void, fallo: () => void) {
    const n = i.evidenciasAdjuntas.length
    confirmar({
      que: `la incidencia ${acortar(i.folio, 40)}`,
      detalle: `${n ? `Se borrarán también sus ${n} evidencia${n === 1 ? '' : 's'}. ` : ''}Se borra de forma permanente y no se puede deshacer.`,
      alAceptar: async () => {
        try {
          const r = await eliminar(i.id)
          aviso('success', 'Incidencia eliminada', `${r?.folio ?? i.folio} · ${r?.archivosEliminados ?? n} archivo(s) eliminado(s).`)
          eliminada()
        } catch (e) {
          // 409/403/404 ya los avisó el interceptor; el resto se muestra aquí.
          if (![403, 404, 409].includes(estadoHttp(e) ?? 0)) aviso('error', 'No se pudo eliminar', mensajeError(e))
          fallo()
        }
      },
    })
  }

  return { pedir }
}
