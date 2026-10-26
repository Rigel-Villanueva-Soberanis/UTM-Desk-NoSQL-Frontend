import { nextTick, ref } from 'vue'
import { aviso } from '@/core/http/avisos'
import { aMapa, estadoHttp, mensajeError } from '@/core/http/errores'

interface Opciones<T> {
  /** Validación en cliente (mismas reglas que el backend). Devuelve { campo: mensaje }; vacío = válido. La clave `_general` va al mensaje de arriba. */
  validar?: () => Record<string, string | undefined>
  /** La llamada al backend. */
  enviar: () => Promise<T>
  /** Toast de éxito. */
  exito: (respuesta: T) => { titulo: string; detalle?: string }
  /** Campos que el diálogo muestra; un error del backend de otro campo se agrega al mensaje general. */
  campos?: string[]
}

/**
 * Lo común a los diálogos de acción (Paso 8: incidencias; Paso 11: usuarios y catálogos):
 *  - un solo envío a la vez (doble clic / Enter repetido no duplican);
 *  - errores por campo (`errors[]` del backend) y mensaje general;
 *  - éxito → toast + `alExito()` (por defecto `alActualizar`: la pantalla se recarga) y se cierra;
 *  - 409 (la incidencia cambió o ya no admite la acción), 403 y 404 → el interceptor ya avisó;
 *    aquí se recarga la pantalla y se cierra el diálogo, porque lo que se veía quedó desactualizado.
 */
export function useAccion(alActualizar: () => void, alExito: () => void = alActualizar) {
  const abierto = ref(true)
  const enviando = ref(false)
  const errores = ref<Record<string, string>>({})
  const mensaje = ref('')

  /** Quita el error de un campo cuando la persona lo corrige. */
  function limpiar(...campos: string[]) {
    for (const c of campos)
      for (const k of Object.keys(errores.value)) if (k === c || k.startsWith(`${c}[`) || k.startsWith(`${c}.`)) delete errores.value[k]
  }

  /** Lleva el foco al primer campo con error. */
  async function enfocarPrimerError() {
    await nextTick()
    const el = document.querySelector<HTMLElement>(
      '.p-dialog .invalido :is(input, textarea, [role="combobox"], [role="button"], [role="radio"])',
    )
    el?.focus({ preventScroll: false })
  }

  async function ejecutar<T>(o: Opciones<T>): Promise<T | undefined> {
    if (enviando.value) return undefined
    mensaje.value = ''

    if (o.validar) {
      const v = Object.fromEntries(Object.entries(o.validar()).filter(([, m]) => !!m)) as Record<string, string>
      // `_general`: un problema que no es de un campo en particular (se muestra arriba, en el mensaje)
      const general = v._general ?? ''
      delete v._general
      errores.value = v
      if (general) aviso('warn', 'Revisa los datos', general)
      if (general || Object.keys(errores.value).length) {
        void enfocarPrimerError()
        return undefined
      }
    } else errores.value = {}

    enviando.value = true
    try {
      const r = await o.enviar()
      const t = o.exito(r)
      aviso('success', t.titulo, t.detalle)
      alExito()
      abierto.value = false
      return r
    } catch (e) {
      const estado = estadoHttp(e)
      if (estado === 409 || estado === 403 || estado === 404) {
        alActualizar()
        abierto.value = false
        return undefined
      }
      const mapa = aMapa(e)
      errores.value = mapa
      let texto = mensajeError(e)
      if (o.campos) {
        // Un error de un campo que este diálogo no muestra se agrega (una sola vez) al mensaje general.
        const conocido = (k: string) => {
          const base = k.charAt(0).toLowerCase() + k.slice(1)
          return o.campos!.some((c) => base === c || base.startsWith(`${c}[`) || base.startsWith(`${c}.`))
        }
        const ajenos = new Set(Object.entries(mapa).filter(([k]) => !conocido(k)).map(([, m]) => m))
        for (const m of ajenos) texto += ` ${m}`
      }
      aviso('error', 'No se pudo completar la acción', texto)
      void enfocarPrimerError()
      return undefined
    } finally {
      enviando.value = false
    }
  }

  return { abierto, enviando, errores, mensaje, limpiar, ejecutar }
}
