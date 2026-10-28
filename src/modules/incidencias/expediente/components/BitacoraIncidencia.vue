<script setup lang="ts">
import { computed } from 'vue'
import { formatearFecha } from '@/core/utils/fechas'
import { normalizarTexto } from '@/core/utils/texto'
import EstadoBadge from '@/shared/components/EstadoBadge.vue'
import PantallaVacia from '@/shared/components/PantallaVacia.vue'
import type { Seguimiento, TipoSeguimiento } from '../../types/incidencia.types'

const props = defineProps<{ historial: Seguimiento[] }>()

/** Las evidencias se ven en su propia sección (con las fotos); aquí no se repiten. */
const eventos = computed(() => props.historial.filter((e) => e.tipo !== 'evidencia'))

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
const COLORES: Record<TipoSeguimiento, string> = {
  creacion: 'azul',
  evidencia: 'gris',
  asignacion: 'turquesa',
  reasignacion: 'turquesa',
  cambio_estado: 'azul',
  nota: 'indigo',
  horas: 'ambar',
  etiquetas: 'morado',
  servicio_externo: 'cian',
  edicion: 'cielo',
}

const icono = (e: Seguimiento) => (esFinal(e) ? 'pi-check' : (ICONOS[e.tipo] ?? 'pi-circle'))
const esFinal = (e: Seguimiento) => e.tipo === 'cambio_estado' && ['resuelta', 'cerrada'].includes(normalizarTexto(e.estadoReportado ?? ''))
const color = (e: Seguimiento) => (esFinal(e) ? 'verde' : (COLORES[e.tipo] ?? 'gris'))

const ROL_COLOR: Record<string, string> = {
  root: 'verde',
  reportante: 'gris',
  tecnico: 'turquesa',
  soporte: 'morado',
  administrativos: 'cian',
  directivos: 'ambar',
}
const colorRol = (rol?: string | null) => ROL_COLOR[normalizarTexto(rol ?? '')] ?? 'gris'

/** En un cambio de estado la acción dice «… Motivo: texto»; el motivo se muestra aparte, resaltado. */
function motivo(e: Seguimiento): string {
  if (e.tipo !== 'cambio_estado') return ''
  const m = /motivo:\s*([\s\S]+)$/i.exec(e.accion)
  return m?.[1]?.trim() ?? ''
}
/** Horas registradas ("Se registraron 1.5 h de trabajo") para mostrarlas como etiqueta. */
function horas(e: Seguimiento): string {
  if (e.tipo !== 'horas') return ''
  const m = /(\d+(?:[.,]\d+)?)\s*h\b/i.exec(e.accion)
  return m?.[1] ? `${m[1]} h` : ''
}
/** En un cambio de estado los badges ya dicen «de → a»; el texto solo se muestra en los demás eventos. */
const mostrarTexto = (e: Seguimiento) => !(e.tipo === 'cambio_estado' && e.estadoReportado)
</script>

<template>
  <section class="bloque">
    <header class="cabecera-bloque">
      <h2><i class="pi pi-history" aria-hidden="true" /> Bitácora de seguimiento</h2>
      <span class="contador">{{ eventos.length }} {{ eventos.length === 1 ? 'evento' : 'eventos' }}</span>
    </header>

    <PantallaVacia v-if="!eventos.length" icono="pi pi-history" titulo="Sin movimientos" />

    <ol v-else class="linea">
      <li v-for="(e, i) in eventos" :key="i" class="item" :class="[color(e), { final: esFinal(e) }]" :data-tipo="e.tipo">
        <span class="marcador"><i :class="['pi', icono(e)]" aria-hidden="true" /></span>
        <article class="evento">
          <div class="autor">
            <span class="quien">
              <strong>{{ e.autor.nombre }}</strong>
              <span v-if="e.autor.rol" class="rol" :class="colorRol(e.autor.rol)">{{ e.autor.rol }}</span>
            </span>
            <time class="fecha">{{ formatearFecha(e.fecha) }}</time>
          </div>

          <div v-if="e.tipo === 'cambio_estado' && e.estadoReportado" class="cambio">
            <EstadoBadge v-if="e.estadoAnterior" :estado="e.estadoAnterior" />
            <i v-if="e.estadoAnterior" class="pi pi-arrow-right" aria-hidden="true" />
            <EstadoBadge :estado="e.estadoReportado" />
          </div>

          <p v-if="mostrarTexto(e)" class="accion">
            <span v-if="horas(e)" class="horas"><i class="pi pi-stopwatch" aria-hidden="true" /> {{ horas(e) }}</span>
            {{ e.accion }}
          </p>
          <div v-if="motivo(e)" class="motivo">
            <strong>Motivo:</strong>
            {{ motivo(e) }}
          </div>
        </article>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.cabecera-bloque {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f1f5f9;
}
h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
}
h2 .pi {
  font-size: 0.85rem;
  color: #94a3b8;
}
.contador {
  padding: 2px 10px;
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 0.72rem;
  font-weight: 700;
}

/* Línea continua con un hito por evento */
.linea {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 0;
  padding: 0 0 0 28px;
  list-style: none;
}
.linea::before {
  content: '';
  position: absolute;
  top: 10px;
  bottom: 12px;
  left: 13px;
  width: 2px;
  background: #e2e8f0;
}
.item {
  position: relative;
  min-width: 0;
}
.marcador {
  position: absolute;
  top: 2px;
  left: -28px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 2px solid;
  border-radius: 50%;
  font-size: 0.68rem;
  box-shadow: 0 0 0 4px #fff;
}
.evento {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  margin-left: 12px;
  padding: 12px;
  background: rgba(248, 250, 252, 0.7);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 12px;
  transition: background 0.15s;
}
.evento:hover {
  background: #f8fafc;
}
.final .evento {
  background: rgba(236, 253, 245, 0.45);
  border-color: rgba(167, 243, 208, 0.9);
}
.final .marcador {
  background: #10b981 !important;
  border-color: #fff !important;
  color: #fff !important;
  box-shadow: 0 0 0 4px #a7f3d0;
}

.autor {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 4px 8px;
}
.quien {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 0.78rem;
  color: #1e293b;
  overflow-wrap: anywhere;
}
.rol {
  padding: 1px 6px;
  border: 1px solid;
  border-radius: 4px;
  font-size: 0.62rem;
  font-weight: 600;
}
.fecha {
  font-size: 0.65rem;
  font-weight: 500;
  color: #94a3b8;
}
.accion {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.6;
  color: #334155;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.horas {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 8px;
  border: 1px solid #fde68a;
  border-radius: 6px;
  background: #fef3c7;
  color: #92400e;
  font-size: 0.7rem;
  font-weight: 700;
}
.cambio {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #94a3b8;
}
.final .cambio {
  border-color: #a7f3d0;
}
.motivo {
  padding: 4px 4px 4px 10px;
  border-left: 2px solid #3b82f6;
  border-radius: 0 6px 6px 0;
  background: rgba(239, 246, 255, 0.55);
  font-size: 0.78rem;
  line-height: 1.55;
  color: #334155;
  overflow-wrap: anywhere;
}
.motivo strong {
  display: block;
  font-size: 0.68rem;
  color: #1e3a8a;
}
.final .motivo {
  border-left-color: #10b981;
  background: rgba(209, 250, 229, 0.4);
}
.final .motivo strong {
  color: #064e3b;
}

/* Color por tipo de evento (marcador y rol) */
.azul .marcador { background: #eff6ff; border-color: #3b82f6; color: #2563eb; }
.gris .marcador { background: #f8fafc; border-color: #64748b; color: #475569; }
.turquesa .marcador { background: #f0fdfa; border-color: #14b8a6; color: #0d9488; }
.indigo .marcador { background: #eef2ff; border-color: #6366f1; color: #4f46e5; }
.ambar .marcador { background: #fffbeb; border-color: #f59e0b; color: #d97706; }
.morado .marcador { background: #faf5ff; border-color: #a855f7; color: #9333ea; }
.cian .marcador { background: #ecfeff; border-color: #0891b2; color: #0891b2; }
.cielo .marcador { background: #f0f9ff; border-color: #0ea5e9; color: #0284c7; }
.rol.gris { background: #f1f5f9; border-color: #e2e8f0; color: #475569; }
.rol.turquesa { background: rgba(204, 251, 241, 0.7); border-color: rgba(153, 246, 228, 0.7); color: #115e59; }
.rol.morado { background: rgba(243, 232, 255, 0.7); border-color: rgba(233, 213, 255, 0.7); color: #7e22ce; }
.rol.cian { background: rgba(207, 250, 254, 0.7); border-color: rgba(165, 243, 252, 0.7); color: #155e75; }
.rol.verde { background: #d1fae5; border-color: #a7f3d0; color: #065f46; }
.rol.ambar { background: #fef3c7; border-color: #fde68a; color: #92400e; }
</style>
