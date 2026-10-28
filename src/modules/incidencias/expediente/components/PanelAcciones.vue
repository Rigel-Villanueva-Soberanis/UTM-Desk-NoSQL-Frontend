<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import { flujoTecnico, reglas } from '@/core/auth/reglas'
import { useSesionStore } from '@/core/auth/sesion.store'
import { usePermisos } from '@/core/auth/usePermisos'
import type { Permiso } from '@/core/auth/permisos'
import type { Accion, Incidencia } from '../../types/incidencia.types'

const props = defineProps<{ incidencia: Incidencia }>()
const emit = defineEmits<{ accion: [accion: Accion] }>()

const { puede } = usePermisos()
const sesion = useSesionStore()

interface Boton {
  accion: Accion
  etiqueta: string
  icono: string
  permiso: Permiso
  /** Regla por incidencia (si es suya, si está asignada a mí, si ya cerró). */
  regla?: (i: Incidencia, u: NonNullable<typeof sesion.usuario>) => boolean
  severity?: 'danger' | 'secondary'
}

/** Un botón por acción del Paso 8: se muestra con `puede()` (rol) Y `reglas` (esta incidencia). */
const botones = computed<Boton[]>(() => [
  {
    accion: 'asignar',
    etiqueta: props.incidencia.tecnicoAsignado ? 'Reasignar técnico' : 'Asignar técnico',
    icono: 'pi pi-user-plus',
    permiso: 'incidencias.asignar',
    regla: (i) => reglas.asignar(i),
  },
  { accion: 'estado', etiqueta: 'Cambiar estado', icono: 'pi pi-sync', permiso: 'incidencias.cambiarEstado', regla: reglas.cambiarEstado },
  { accion: 'cerrar', etiqueta: 'Cerrar incidencia', icono: 'pi pi-lock', permiso: 'incidencias.cerrar', regla: (i) => reglas.cerrar(i) },
  { accion: 'nota', etiqueta: 'Agregar nota', icono: 'pi pi-comment', permiso: 'incidencias.seguimiento', regla: reglas.seguimiento },
  { accion: 'horas', etiqueta: 'Registrar tiempo', icono: 'pi pi-clock', permiso: 'incidencias.horas', regla: reglas.horas },
  { accion: 'evidencia', etiqueta: 'Agregar evidencia', icono: 'pi pi-paperclip', permiso: 'incidencias.evidencias', regla: reglas.evidencias },
  { accion: 'etiquetas', etiqueta: 'Etiquetas', icono: 'pi pi-tags', permiso: 'incidencias.tags', regla: reglas.tags },
  { accion: 'externo', etiqueta: 'Proveedor externo', icono: 'pi pi-building', permiso: 'incidencias.externo', regla: (i) => reglas.externo(i) },
  { accion: 'editar', etiqueta: 'Editar', icono: 'pi pi-pencil', permiso: 'incidencias.editar', regla: reglas.editar },
  { accion: 'eliminar', etiqueta: 'Eliminar', icono: 'pi pi-trash', permiso: 'incidencias.eliminar', severity: 'danger' },
])

const visibles = computed(() => {
  const u = sesion.usuario
  if (!u) return []
  return botones.value.filter((b) => puede(b.permiso) && (!b.regla || b.regla(props.incidencia, u)))
})

/**
 * Mesa del técnico (Paso 9): sus acciones de todos los días van arriba como accesos rápidos
 * (Nota, Horas, Evidencia y «Marcar resuelta») para trabajar sin salir del expediente.
 */
const RAPIDAS: Accion[] = ['nota', 'horas', 'evidencia']
const esTecnico = computed(() => sesion.rol === 'tecnico')
const rapidas = computed(() => (esTecnico.value ? visibles.value.filter((b) => RAPIDAS.includes(b.accion)) : []))
const generales = computed(() => (esTecnico.value ? visibles.value.filter((b) => !RAPIDAS.includes(b.accion)) : visibles.value))
const puedeResolver = computed(() => {
  const u = sesion.usuario
  return (
    esTecnico.value &&
    !!u &&
    puede('incidencias.cambiarEstado') &&
    reglas.cambiarEstado(props.incidencia, u) &&
    !!flujoTecnico[props.incidencia.estado]?.includes('resuelta')
  )
})
</script>

<template>
  <div v-if="visibles.length || puedeResolver" class="panel">
    <div v-if="rapidas.length || puedeResolver" class="rapidas" role="toolbar" aria-label="Accesos rápidos">
      <span class="titulo-rapidas">Acciones rápidas</span>
      <Button
        v-for="b in rapidas"
        :key="b.accion"
        :label="b.etiqueta"
        :icon="b.icono"
        size="small"
        :data-rapida="b.accion"
        :data-accion="b.accion"
        @click="emit('accion', b.accion)"
      />
      <Button
        v-if="puedeResolver"
        label="Marcar resuelta"
        icon="pi pi-check-circle"
        severity="success"
        size="small"
        data-accion="resolver"
        @click="emit('accion', 'resolver')"
      />
    </div>

    <div v-if="generales.length" class="acciones" role="toolbar" aria-label="Acciones de la incidencia">
      <Button
        v-for="b in generales"
        :key="b.accion"
        :label="b.etiqueta"
        :icon="b.icono"
        :severity="b.accion === 'cerrar' ? 'success' : (b.severity ?? 'secondary')"
        :outlined="b.severity === 'danger'"
        size="small"
        :data-accion="b.accion"
        @click="emit('accion', b.accion)"
      />
    </div>
  </div>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.rapidas {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}
.titulo-rapidas {
  margin-right: 4px;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #94a3b8;
}
.acciones {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
/* Botones blancos con borde y el icono de color según la acción; «Eliminar» en rosa. */
.acciones :deep(.p-button) {
  padding: 8px 14px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  color: #334155;
  font-size: 0.78rem;
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
  transition: background 0.15s, border-color 0.15s, box-shadow 0.15s, transform 0.1s;
}
.acciones :deep(.p-button:hover) {
  background: #f8fafc;
  border-color: #cbd5e1;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08);
}
.acciones :deep(.p-button:active) {
  transform: scale(0.98);
}
.acciones :deep(.p-button-icon) {
  font-size: 0.85rem;
}
.acciones :deep([data-accion='asignar'] .p-button-icon) { color: #2563eb; }
.acciones :deep([data-accion='estado'] .p-button-icon) { color: #059669; }
.acciones :deep([data-accion='nota'] .p-button-icon) { color: #4f46e5; }
.acciones :deep([data-accion='horas'] .p-button-icon) { color: #d97706; }
.acciones :deep([data-accion='evidencia'] .p-button-icon) { color: #475569; }
.acciones :deep([data-accion='etiquetas'] .p-button-icon) { color: #9333ea; }
.acciones :deep([data-accion='externo'] .p-button-icon) { color: #0891b2; }
.acciones :deep([data-accion='editar'] .p-button-icon) { color: #475569; }
.acciones :deep([data-accion='eliminar']) {
  background: #fff1f2;
  border-color: #fecdd3;
  color: #be123c;
}
.acciones :deep([data-accion='eliminar']:hover) {
  background: #ffe4e6;
  border-color: #fda4af;
}
.acciones :deep([data-accion='eliminar'] .p-button-icon) {
  color: #e11d48;
}
</style>
