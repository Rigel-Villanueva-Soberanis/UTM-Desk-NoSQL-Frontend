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
    /** No muestra las elegidas dentro del campo (la pantalla las lista aparte, p. ej. «Etiquetas nuevas»). */
    ocultarElegidas?: boolean
    /** `false` (filtros): sólo se pueden elegir etiquetas que ya existen; si lo escrito no existe, sale «Sin opciones encontradas». */
    permitirNuevas?: boolean
  }>(),
  { max: 15, placeholder: 'Escribe para buscar…', disabled: false, invalid: false, inputId: undefined, ocultarElegidas: false, permitirNuevas: true },
)

const etiquetas = defineModel<string[]>({ default: () => [] })
const sugerencias = ref<string[]>([])
let ultimaBusqueda = 0
/** Etiquetas que el backend ha devuelto (las únicas elegibles cuando no se permiten nuevas). */
const existentes = new Set<string>()

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
  lista.forEach((t) => existentes.add(t))
  const disponibles = lista.filter((t) => !etiquetas.value.includes(t))
  const nueva = props.permitirNuevas && q && VALIDA.test(q) && !lista.includes(q) && !etiquetas.value.includes(q)
  sugerencias.value = nueva ? [q, ...disponibles] : disponibles
}

function alCambiar(valores: string[] | null) {
  const limpias = [...new Set((valores ?? []).map(normalizarTexto).filter((v) => VALIDA.test(v) && (props.permitirNuevas || existentes.has(v) || etiquetas.value.includes(v))))]
  etiquetas.value = props.max === 1 ? limpias.slice(-1) : limpias.slice(0, props.max)
}
</script>

<template>
  <!-- Enter solo agrega la etiqueta: sin esto el formulario que lo contiene se enviaba (guardaba) al instante. -->
  <div class="selector" @keydown.enter.prevent>
  <AutoComplete
    :model-value="etiquetas"
    :suggestions="sugerencias"
    :input-id="inputId"
    :placeholder="etiquetas.length && !ocultarElegidas ? '' : placeholder"
    :class="{ 'sin-elegidas': ocultarElegidas }"
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
  </div>
</template>

<style scoped>
.selector {
  width: 100%;
  min-width: 0;
}
.sin-elegidas :deep(.p-autocomplete-chip-item) {
  display: none;
}
</style>
