<script setup lang="ts">
import Timeline from 'primevue/timeline'
import { formatearFecha } from '@/core/utils/fechas'
import EstadoBadge from '@/shared/components/EstadoBadge.vue'
import PantallaVacia from '@/shared/components/PantallaVacia.vue'
import type { Seguimiento, TipoSeguimiento } from '../../types/incidencia.types'

defineProps<{ historial: Seguimiento[] }>()

const ICONOS: Record<TipoSeguimiento, string> = {
  creacion: 'pi-plus',
  evidencia: 'pi-paperclip',
  asignacion: 'pi-user',
  reasignacion: 'pi-refresh',
  cambio_estado: 'pi-sync',
  nota: 'pi-comment',
  horas: 'pi-clock',
  etiquetas: 'pi-tags',
  servicio_externo: 'pi-building',
  edicion: 'pi-pencil',
}

const icono = (tipo: string) => ICONOS[tipo as TipoSeguimiento] ?? 'pi-circle'
</script>

<template>
  <section class="bloque">
    <h2>Bitácora</h2>

    <PantallaVacia v-if="!historial.length" icono="pi pi-history" titulo="Sin movimientos" />

    <Timeline v-else :value="historial" class="linea">
      <template #marker="{ item }">
        <span class="marcador" :data-tipo="item.tipo"><i :class="['pi', icono(item.tipo)]" /></span>
      </template>
      <template #content="{ item }">
        <article class="evento">
          <p class="accion">{{ item.accion }}</p>
          <div v-if="item.tipo === 'cambio_estado' && item.estadoReportado" class="cambio">
            <EstadoBadge v-if="item.estadoAnterior" :estado="item.estadoAnterior" />
            <i v-if="item.estadoAnterior" class="pi pi-arrow-right" />
            <EstadoBadge :estado="item.estadoReportado" />
          </div>
          <p class="meta">
            {{ item.autor.nombre }}<template v-if="item.autor.rol"> ({{ item.autor.rol }})</template>
            · {{ formatearFecha(item.fecha) }}
          </p>
        </article>
      </template>
      <template #opposite><span /></template>
    </Timeline>
  </section>
</template>

<style scoped>
:deep(.p-timeline-event-content) {
  min-width: 0;
}
h2 {
  margin-bottom: 12px;
}
/* Solo el contenido a la derecha del marcador (sin columna "opuesta") */
:deep(.p-timeline-event-opposite) {
  display: none;
}
.evento {
  min-width: 0;
  padding-bottom: 20px;
}
.marcador {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--surface-container);
  color: var(--accent);
  font-size: 0.85rem;
}
.accion {
  white-space: pre-wrap;
  font-weight: 500;
  overflow-wrap: anywhere;
}
.cambio {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 6px 0 2px;
  color: var(--on-surface-variant);
}
.meta {
  overflow-wrap: anywhere;
  margin-top: 2px;
  font-size: 0.75rem;
  color: var(--on-surface-variant);
}
</style>
