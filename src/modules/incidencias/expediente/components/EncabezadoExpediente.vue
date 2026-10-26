<script setup lang="ts">
import { formatearFecha } from '@/core/utils/fechas'
import EstadoBadge from '@/shared/components/EstadoBadge.vue'
import PrioridadBadge from '@/shared/components/PrioridadBadge.vue'
import type { Incidencia } from '../../types/incidencia.types'

defineProps<{ incidencia: Incidencia }>()
</script>

<template>
  <header class="encabezado">
    <p class="folio">{{ incidencia.folio }}</p>
    <h1>{{ incidencia.titulo }}</h1>
    <div class="etiquetas">
      <EstadoBadge :estado="incidencia.estado" />
      <PrioridadBadge :prioridad="incidencia.prioridad" />
    </div>
    <dl class="fechas">
      <div>
        <dt>Creada</dt>
        <dd>{{ formatearFecha(incidencia.fechas.creacion) }}</dd>
      </div>
      <div v-if="incidencia.fechas.resolucion">
        <dt>Resuelta</dt>
        <dd>{{ formatearFecha(incidencia.fechas.resolucion) }}</dd>
      </div>
    </dl>
  </header>
</template>

<style scoped>
.folio {
  font-weight: 600;
  color: var(--accent);
  letter-spacing: 0.02em;
  overflow-wrap: anywhere;
}
h1 {
  margin: 4px 0 12px;
}
.etiquetas {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.fechas {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 32px;
  margin: 16px 0 0;
}
.fechas div {
  display: flex;
  flex-direction: column;
}
dt {
  font-size: 0.75rem;
  color: var(--on-surface-variant);
}
dd {
  margin: 0;
  font-weight: 500;
}
</style>
