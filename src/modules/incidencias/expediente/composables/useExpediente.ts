import axios from 'axios'
import { ref, watch, type Ref } from 'vue'
import { aviso } from '@/core/http/avisos'
import { mensajeError } from '@/core/http/errores'
import { obtener } from '../../api/incidencias.api'
import type { Incidencia } from '../../types/incidencia.types'

/** Por qué no se pudo mostrar el expediente. */
export type ErrorExpediente = 'prohibido' | 'no-encontrado' | 'otro'

/** Carga el expediente de una incidencia y lo vuelve a cargar cuando cambia el id. */
export function useExpediente(id: Ref<string>) {
  const incidencia = ref<Incidencia | null>(null)
  const cargando = ref(false)
  const error = ref<ErrorExpediente | null>(null)
  const mensaje = ref('')
  let ultimaPeticion = 0

  async function cargar(silencioso: boolean) {
    const n = ++ultimaPeticion
    if (!silencioso) {
      cargando.value = true
      incidencia.value = null
    }
    error.value = null
    try {
      const r = await obtener(id.value)
      if (n === ultimaPeticion) incidencia.value = r
    } catch (e) {
      if (n !== ultimaPeticion) return
      const status = axios.isAxiosError(e) ? e.response?.status : undefined
      mensaje.value = mensajeError(e)
      if (status === 403) error.value = 'prohibido'
      else if (status === 404 || status === 400) error.value = 'no-encontrado' // 400: id con formato inválido
      else if (silencioso && incidencia.value) aviso('error', 'No se pudo actualizar', mensaje.value) // se queda lo ya cargado
      else error.value = 'otro'
      if (error.value) incidencia.value = null
    } finally {
      if (n === ultimaPeticion) cargando.value = false
    }
  }

  watch(id, () => void cargar(false), { immediate: true })

  return {
    incidencia,
    cargando,
    error,
    mensaje,
    /** Vuelve a pedir el expediente sin parpadeo (lo usarán las acciones del Paso 8). */
    recargar: () => cargar(true),
    /** Reintento completo, con pantalla de carga. */
    reintentar: () => cargar(false),
  }
}
