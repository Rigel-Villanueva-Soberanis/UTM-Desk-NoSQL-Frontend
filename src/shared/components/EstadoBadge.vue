<script setup lang="ts">
import { computed } from 'vue'
import Tag from 'primevue/tag'
import { normalizarTexto } from '@/core/utils/texto'

const props = defineProps<{ estado: string }>()

const MAPA: Record<string, { etiqueta: string; severity: 'info' | 'warn' | 'success' | 'secondary'; estilo?: Record<string, string> }> = {
  abierta: { etiqueta: 'Abierta', severity: 'info' },
  'en proceso': { etiqueta: 'En proceso', severity: 'warn' },
  'en espera': { etiqueta: 'En espera', severity: 'secondary', estilo: { background: 'color-mix(in srgb, #7c3aed 14%, transparent)', color: '#6d28d9' } },
  resuelta: { etiqueta: 'Resuelta', severity: 'success' },
  cerrada: { etiqueta: 'Cerrada', severity: 'secondary', estilo: { background: 'color-mix(in srgb, #0f766e 16%, transparent)', color: '#0f766e' } },
  cancelada: { etiqueta: 'Cancelada', severity: 'secondary' },
}

const dato = computed(() => MAPA[normalizarTexto(props.estado)] ?? { etiqueta: props.estado, severity: 'secondary' as const })
</script>

<template>
  <Tag :value="dato.etiqueta" :severity="dato.severity" :style="{ whiteSpace: 'nowrap', ...dato.estilo }" rounded />
</template>
