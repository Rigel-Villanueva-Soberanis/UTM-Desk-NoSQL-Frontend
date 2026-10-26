<script setup lang="ts">
import { computed } from 'vue'
import Tag from 'primevue/tag'
import { normalizarTexto } from '@/core/utils/texto'

const props = defineProps<{ estado: string }>()

const MAPA: Record<string, { etiqueta: string; severity: 'info' | 'warn' | 'success' | 'secondary'; estilo?: Record<string, string> }> = {
  abierta: { etiqueta: 'Abierta', severity: 'info' },
  'en proceso': { etiqueta: 'En proceso', severity: 'warn' },
  'por autorizar': {
    etiqueta: 'Por autorizar',
    severity: 'secondary',
    estilo: { background: '#ede9fe', color: '#5b21b6' },
  },
  resuelta: { etiqueta: 'Resuelta', severity: 'success' },
  cancelada: { etiqueta: 'Cancelada', severity: 'secondary' },
}

const dato = computed(() => MAPA[normalizarTexto(props.estado)] ?? { etiqueta: props.estado, severity: 'secondary' as const })
</script>

<template>
  <Tag :value="dato.etiqueta" :severity="dato.severity" :style="{ whiteSpace: 'nowrap', ...dato.estilo }" rounded />
</template>
