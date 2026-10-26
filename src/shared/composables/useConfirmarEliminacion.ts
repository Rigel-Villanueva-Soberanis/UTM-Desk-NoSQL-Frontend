import { useConfirm } from 'primevue/useconfirm'

interface Opciones {
  /** Qué se va a eliminar, tal como se leerá en la pregunta: «la imagen "foto.png"», «al usuario "Ana"». */
  que: string
  /** Texto extra opcional bajo la pregunta (p. ej. «No se puede deshacer»). */
  detalle?: string
  /** Se ejecuta solo si la persona pulsa «Aceptar». */
  alAceptar: () => void | Promise<void>
}

/**
 * Modal único de confirmación para eliminar cualquier cosa:
 * «¿Estás seguro de eliminar {que}?» con los botones Aceptar y Cancelar.
 * Usa el ConfirmDialog global de App.vue, así que se ve igual en toda la aplicación.
 */
export function useConfirmarEliminacion() {
  const confirm = useConfirm()

  function confirmar({ que, detalle, alAceptar }: Opciones) {
    confirm.require({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de eliminar ${que}?${detalle ? ' ' + detalle : ''}`,
      icon: 'pi pi-exclamation-triangle',
      rejectProps: { label: 'Cancelar', severity: 'secondary', text: true },
      acceptProps: { label: 'Aceptar', severity: 'danger' },
      accept: alAceptar,
    })
  }

  return { confirmar }
}
