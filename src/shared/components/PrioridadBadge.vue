<script setup lang="ts">
import { computed } from 'vue'
import Tag from 'primevue/tag'
import { normalizarTexto } from '@/core/utils/texto'

const props = defineProps<{ prioridad: string }>()

const MAPA: Record<string, { etiqueta: string; severity: 'info' | 'warn' | 'danger' | 'secondary' }> = {
  baja: { etiqueta: 'Baja', severity: 'secondary' },
  media: { etiqueta: 'Media', severity: 'info' },
  alta: { etiqueta: 'Alta', severity: 'warn' },
  critica: { etiqueta: 'Crítica', severity: 'danger' },
}

const dato = computed(() => MAPA[normalizarTexto(props.prioridad)] ?? { etiqueta: props.prioridad, severity: 'secondary' as const })
</script>

<template>
  <Tag :value="dato.etiqueta" :severity="dato.severity" :style="{ whiteSpace: 'nowrap' }" rounded />
</template>
