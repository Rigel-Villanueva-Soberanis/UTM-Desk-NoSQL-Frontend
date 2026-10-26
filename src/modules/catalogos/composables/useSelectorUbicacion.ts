import { computed, ref } from 'vue'
import type { AutoCompleteCompleteEvent } from 'primevue/autocomplete'
import { normalizarTexto } from '@/core/utils/texto'
import { useCatalogos } from './useCatalogos'

interface OpcionEdificio {
  clave: string
  nombre: string
}

/**
 * Los dos campos de ubicación (edificio y, al elegirlo, su salón) con búsqueda directa.
 * Trabaja sobre un objeto con `claveEdificio` y `salon` (el formulario de reportar o de editar).
 * Al cambiar de edificio el salón se vacía, porque cada edificio tiene los suyos.
 */
export function useSelectorUbicacion(form: { claveEdificio: string; salon: string }) {
  const { edificios, salonesDe } = useCatalogos()

  const opciones = computed<OpcionEdificio[]>(() => edificios.value.map((e) => ({ clave: e.clave, nombre: e.edificio })))
  const sugerenciasEdificio = ref<OpcionEdificio[]>([])
  const sugerenciasSalon = ref<string[]>([])

  const edificioElegido = computed<OpcionEdificio | null>({
    get: () => opciones.value.find((o) => o.clave === form.claveEdificio) ?? null,
    set: (v) => {
      const clave = v && typeof v === 'object' ? v.clave : ''
      if (clave === form.claveEdificio) return
      form.claveEdificio = clave
      form.salon = ''
    },
  })
  const salonElegido = computed<string | null>({
    get: () => form.salon || null,
    set: (v) => {
      form.salon = typeof v === 'string' ? v : ''
    },
  })

  const salones = computed(() => salonesDe(form.claveEdificio))
  /** Se puede enviar solo si el edificio y el salón existen en el catálogo. */
  const valida = computed(() => !!edificioElegido.value && salones.value.includes(form.salon))

  const filtrar = <T>(lista: T[], q: string, texto: (x: T) => string) => {
    const n = normalizarTexto(q)
    return n ? lista.filter((x) => normalizarTexto(texto(x)).includes(n)) : [...lista]
  }
  // Si el texto es justo el valor ya elegido (al volver a enfocar el campo), se ofrece la lista completa para poder cambiarlo.
  const buscarEdificio = (e: AutoCompleteCompleteEvent) => {
    const igual = normalizarTexto(e.query) === normalizarTexto(edificioElegido.value?.nombre ?? '\u0000')
    sugerenciasEdificio.value = filtrar(opciones.value, igual ? '' : e.query, (o) => o.nombre)
  }
  const buscarSalon = (e: AutoCompleteCompleteEvent) => {
    const igual = normalizarTexto(e.query) === normalizarTexto(form.salon || '\u0000')
    sugerenciasSalon.value = filtrar(salones.value, igual ? '' : e.query, (s) => s)
  }

  return { edificioElegido, salonElegido, sugerenciasEdificio, sugerenciasSalon, buscarEdificio, buscarSalon, salones, valida }
}
