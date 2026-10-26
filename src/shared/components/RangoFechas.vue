<script setup lang="ts">
import { ref, watch } from 'vue'
import DatePicker from 'primevue/datepicker'
import { aFechaIso, desdeFechaIso } from '@/core/utils/fechas'
import CampoError from './CampoError.vue'

/** Dos fechas ("AAAA-MM-DD") con la validación "desde ≤ hasta". Solo avisa cuando el rango es válido. */
const props = defineProps<{
  desde: string
  hasta: string
  etiquetaDesde: string
  etiquetaHasta: string
  /** Prefijo de los `id` (varios en una misma pantalla). */
  idBase: string
}>()
const emit = defineEmits<{ cambiar: [rango: { fechaDesde: string; fechaHasta: string }] }>()

const d = ref<Date | null>(desdeFechaIso(props.desde))
const h = ref<Date | null>(desdeFechaIso(props.hasta))
const error = ref('')

// Si la URL cambia (atrás, limpiar…), se actualizan los controles.
watch(
  () => [props.desde, props.hasta],
  ([a, b]) => {
    d.value = desdeFechaIso(a ?? '')
    h.value = desdeFechaIso(b ?? '')
    error.value = ''
  },
)

const fecha = (v: unknown): Date | null => (v instanceof Date ? v : null)

function cambiar(cual: 'desde' | 'hasta', v: unknown) {
  if (cual === 'desde') d.value = fecha(v)
  else h.value = fecha(v)
  if (d.value && h.value && d.value > h.value) {
    error.value = 'La fecha inicial no puede ser posterior a la final.'
    return
  }
  error.value = ''
  emit('cambiar', { fechaDesde: d.value ? aFechaIso(d.value) : '', fechaHasta: h.value ? aFechaIso(h.value) : '' })
}
</script>

<template>
  <div class="campo">
    <label :for="`${idBase}-desde`">{{ etiquetaDesde }}</label>
    <DatePicker
      :input-id="`${idBase}-desde`"
      :model-value="d"
      date-format="dd/mm/yy"
      placeholder="dd/mm/aaaa"
      show-icon
      show-button-bar
      fluid
      @update:model-value="(v) => cambiar('desde', v)"
    />
  </div>
  <div class="campo">
    <label :for="`${idBase}-hasta`">{{ etiquetaHasta }}</label>
    <DatePicker
      :input-id="`${idBase}-hasta`"
      :model-value="h"
      date-format="dd/mm/yy"
      placeholder="dd/mm/aaaa"
      :invalid="!!error"
      show-icon
      show-button-bar
      fluid
      @update:model-value="(v) => cambiar('hasta', v)"
    />
    <CampoError :mensaje="error" />
  </div>
</template>

<style scoped>
.campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
label {
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--on-surface-variant);
}
</style>
