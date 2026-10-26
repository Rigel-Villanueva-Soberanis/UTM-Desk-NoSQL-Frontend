<script setup lang="ts">
import { ref } from 'vue'
import AutoComplete, { type AutoCompleteCompleteEvent } from 'primevue/autocomplete'
import { normalizarTexto } from '@/core/utils/texto'
import { tagsSugeridos } from '@/modules/incidencias/api/incidencias.api'

const props = withDefaults(
  defineProps<{
    /** Máximo de etiquetas. Con 1, elegir otra reemplaza la anterior (sirve para filtros). */
    max?: number
    placeholder?: string
    disabled?: boolean
    invalid?: boolean
    inputId?: string
  }>(),
  { max: 15, placeholder: 'Escribe para buscar…', disabled: false, invalid: false, inputId: undefined },
)

const etiquetas = defineModel<string[]>({ default: () => [] })
const sugerencias = ref<string[]>([])
let ultimaBusqueda = 0

/** Regla del backend: 2–30 caracteres; letras, números, espacio, "-" y "_" (ya sin acentos ni mayúsculas). */
const VALIDA = /^[a-z0-9 _-]{2,30}$/

/** Pide sugerencias a GET /api/incidencias/tags-sugeridos?busqueda=. Lo escrito se ofrece primero para poder crear etiquetas nuevas. */
async function buscar(e: AutoCompleteCompleteEvent) {
  const q = normalizarTexto(e.query)
  const id = ++ultimaBusqueda
  let lista: string[] = []
  try {
    lista = await tagsSugeridos(q)
  } catch {
    lista = [] // el interceptor ya avisó; se puede seguir escribiendo a mano
  }
  if (id !== ultimaBusqueda) return // llegó una respuesta vieja
  const disponibles = lista.filter((t) => !etiquetas.value.includes(t))
  const nueva = q && VALIDA.test(q) && !lista.includes(q) && !etiquetas.value.includes(q)
  sugerencias.value = nueva ? [q, ...disponibles] : disponibles
}

function alCambiar(valores: string[] | null) {
  const limpias = [...new Set((valores ?? []).map(normalizarTexto).filter((v) => VALIDA.test(v)))]
  etiquetas.value = props.max === 1 ? limpias.slice(-1) : limpias.slice(0, props.max)
}
</script>

<template>
  <AutoComplete
    :model-value="etiquetas"
    :suggestions="sugerencias"
    :input-id="inputId"
    :placeholder="etiquetas.length ? '' : placeholder"
    :disabled="disabled"
    :invalid="invalid"
    :delay="250"
    :auto-option-focus="true"
    :force-selection="false"
    multiple
    dropdown
    fluid
    @complete="buscar"
    @update:model-value="alCambiar"
  />
</template>
