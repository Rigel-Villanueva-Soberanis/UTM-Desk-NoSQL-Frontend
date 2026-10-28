import axios from 'axios'
import { onBeforeUnmount, ref, watch, type Ref } from 'vue'
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

  /**
   * Las URLs de las evidencias caducan (`venceEn`): poco antes de que venza la primera se vuelve a pedir el
   * expediente en silencio para renovarlas, y también al volver a la pestaña si ya vencieron.
   */
  const MARGEN_MS = 60_000
  let temporizador: ReturnType<typeof setTimeout> | undefined
  const vencimiento = () => {
    const t = (incidencia.value?.evidenciasAdjuntas ?? []).map((e) => Date.parse(e.venceEn ?? '')).filter((n) => Number.isFinite(n))
    return t.length ? Math.min(...t) : null
  }
  watch(incidencia, () => {
    clearTimeout(temporizador)
    const v = vencimiento()
    if (v === null) return
    // setTimeout no admite esperas enormes; con tope de 24 h se vuelve a evaluar.
    const espera = Math.min(Math.max(v - Date.now() - MARGEN_MS, 30_000), 24 * 3_600_000)
    temporizador = setTimeout(() => void cargar(true), espera)
  })
  const alVolver = () => {
    const v = vencimiento()
    if (v !== null && v - Date.now() < MARGEN_MS) void cargar(true)
  }
  window.addEventListener('focus', alVolver)
  onBeforeUnmount(() => {
    clearTimeout(temporizador)
    window.removeEventListener('focus', alVolver)
  })

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
