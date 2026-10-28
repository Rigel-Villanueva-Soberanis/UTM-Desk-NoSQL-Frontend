<script setup lang="ts">
import { formatearFecha } from '@/core/utils/fechas'
import EstadoBadge from '@/shared/components/EstadoBadge.vue'
import PrioridadBadge from '@/shared/components/PrioridadBadge.vue'
import type { Incidencia } from '../../types/incidencia.types'

defineProps<{ incidencia: Incidencia }>()
defineEmits<{ volver: [] }>()
</script>

<template>
  <header class="encabezado">
    <div class="principal">
      <button type="button" class="volver" data-accion="volver" @click="$emit('volver')">
        <i class="pi pi-arrow-left" aria-hidden="true" />
        <span>Volver</span>
      </button>
      <div class="titulo">
        <span class="folio">{{ incidencia.folio }}</span>
        <h1>{{ incidencia.titulo }}</h1>
        <div class="etiquetas">
          <EstadoBadge :estado="incidencia.estado" />
          <PrioridadBadge :prioridad="incidencia.prioridad" />
        </div>
      </div>
    </div>

    <dl class="fechas">
      <div>
        <dt>Creada</dt>
        <dd>{{ formatearFecha(incidencia.fechas.creacion) }}</dd>
      </div>
      <template v-if="incidencia.fechas.resolucion">
        <span class="separador" aria-hidden="true" />
        <div class="resuelta">
          <dt>Resuelta</dt>
          <dd>{{ formatearFecha(incidencia.fechas.resolucion) }}</dd>
        </div>
      </template>
    </dl>
  </header>
</template>

<style scoped>
.encabezado {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
}
.principal {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  flex: 1 1 24rem;
}
.volver {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  padding: 0;
  border: 0;
  background: none;
  color: #2563eb;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}
.volver .pi {
  font-size: 0.7rem;
  transition: transform 0.15s;
}
.volver:hover {
  color: #1d4ed8;
}
.volver:hover .pi {
  transform: translateX(-2px);
}
.titulo {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 12px;
  min-width: 0;
}
.folio {
  padding: 4px 10px;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  background: #eff6ff;
  color: #1d4ed8;
  font-family: ui-monospace, 'JetBrains Mono', 'Cascadia Mono', Consolas, monospace;
  font-size: 0.78rem;
  font-weight: 700;
  overflow-wrap: anywhere;
}
h1 {
  margin: 0;
  min-width: 0;
  font-size: 1.45rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: #0f172a;
  overflow-wrap: anywhere;
}
.etiquetas {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.fechas {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 0;
  padding: 8px 16px;
  background: #f8fafc;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 12px;
  font-size: 0.78rem;
}
.fechas div {
  display: flex;
  flex-direction: column;
}
.separador {
  align-self: stretch;
  width: 1px;
  background: #e2e8f0;
}
dt {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #94a3b8;
}
dd {
  margin: 0;
  font-weight: 600;
  color: #334155;
}
.resuelta dt {
  color: #059669;
}
.resuelta dd {
  font-weight: 700;
  color: #047857;
}
</style>
