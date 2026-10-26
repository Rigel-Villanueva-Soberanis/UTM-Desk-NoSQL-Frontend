import { reactive, ref, watch } from 'vue'
import { aviso } from '@/core/http/avisos'
import { aMapa, estadoHttp, mensajeError } from '@/core/http/errores'
import { LIMITES } from '@/core/utils/validacion'
import { cambiarPassword } from '../api/mi-cuenta.api'

/** Pestaña "Contraseña". La sesión sigue abierta después de cambiarla. */
export function useMiPassword() {
  const form = reactive({ passwordActual: '', nuevaPassword: '', confirmacion: '' })
  const errores = ref<Record<string, string>>({})
  const mensaje = ref('')
  const enviando = ref(false)

  for (const k of Object.keys(form) as (keyof typeof form)[]) watch(() => form[k], () => delete errores.value[k])
  // Al cambiar la nueva, la confirmación se vuelve a evaluar.
  watch(() => form.nuevaPassword, () => delete errores.value.confirmacion)

  function validar(): Record<string, string> {
    const e: Record<string, string> = {}
    if (!form.passwordActual) e.passwordActual = 'Escribe tu contraseña actual.'
    if (!form.nuevaPassword) e.nuevaPassword = 'La nueva contraseña es obligatoria.'
    else if (form.nuevaPassword.length < LIMITES.password.min || form.nuevaPassword.length > LIMITES.password.max)
      e.nuevaPassword = `La contraseña debe tener entre ${LIMITES.password.min} y ${LIMITES.password.max} caracteres.`
    else if (form.nuevaPassword === form.passwordActual) e.nuevaPassword = 'La nueva contraseña debe ser distinta de la actual.'
    if (!form.confirmacion) e.confirmacion = 'Confirma la nueva contraseña.'
    else if (form.confirmacion !== form.nuevaPassword) e.confirmacion = 'Las contraseñas no coinciden.'
    return e
  }

  async function guardar(): Promise<boolean> {
    if (enviando.value) return false
    mensaje.value = ''
    errores.value = validar()
    if (Object.keys(errores.value).length) return false
    enviando.value = true
    try {
      await cambiarPassword(form.passwordActual, form.nuevaPassword)
      form.passwordActual = form.nuevaPassword = form.confirmacion = ''
      errores.value = {}
      aviso('success', 'Contraseña actualizada', 'Úsala la próxima vez que inicies sesión.')
      return true
    } catch (e) {
      const texto = mensajeError(e)
      const mapa = aMapa(e)
      // 401 = contraseña actual incorrecta (no se cierra la sesión): el mensaje va en ese campo.
      if (estadoHttp(e) === 401) {
        errores.value = { passwordActual: texto }
        aviso('error', 'Contraseña actual incorrecta', texto)
        return false
      }
      errores.value = mapa
      const conocidos = ['passwordActual', 'nuevaPassword']
      const ajenos = new Set(Object.entries(mapa).filter(([k]) => !conocidos.includes(k.charAt(0).toLowerCase() + k.slice(1))).map(([, v]) => v))
      aviso('error', 'No se pudo cambiar la contraseña', [texto, ...ajenos].join(' '))
      return false
    } finally {
      enviando.value = false
    }
  }

  return { form, errores, mensaje, enviando, guardar }
}
