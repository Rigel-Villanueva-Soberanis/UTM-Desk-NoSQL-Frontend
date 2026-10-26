<script setup lang="ts">
import { computed } from 'vue'
import Tag from 'primevue/tag'
import { useCatalogos } from '@/modules/catalogos/composables/useCatalogos'
import type { Incidencia } from '../../types/incidencia.types'

const props = defineProps<{ incidencia: Incidencia }>()
const { categoriaPorClave } = useCatalogos()

const categoria = computed(() => categoriaPorClave(props.incidencia.categoria))

const humanizar = (clave: string) => {
  const t = clave.replace(/_/g, ' ')
  return t.charAt(0).toUpperCase() + t.slice(1)
}

/** `detalleEspecifico` con la `etiqueta` del catálogo (en el orden del catálogo). */
const detalle = computed(() => {
  const campos = categoria.value?.campos_dinamicos ?? []
  return Object.entries(props.incidencia.detalleEspecifico)
    .map(([clave, valor]) => ({
      clave,
      etiqueta: campos.find((c) => c.clave === clave)?.etiqueta ?? humanizar(clave),
      valor: String(valor),
      orden: campos.findIndex((c) => c.clave === clave),
    }))
    .sort((a, b) => (a.orden < 0 ? 999 : a.orden) - (b.orden < 0 ? 999 : b.orden))
})

const externo = computed(() =>
  props.incidencia.tecnicoExterno?.requiereServicioExterno ? props.incidencia.tecnicoExterno : null,
)
</script>

<template>
  <section class="bloque">
    <h2>Descripción</h2>
    <p class="descripcion">{{ incidencia.descripcion }}</p>

    <dl class="datos">
      <div>
        <dt>Categoría</dt>
        <dd>{{ categoria?.nombre ?? incidencia.categoria }}</dd>
      </div>
      <div>
        <dt>Ubicación</dt>
        <dd>{{ incidencia.ubicacion.edificio }} – {{ incidencia.ubicacion.aula }}</dd>
      </div>
      <div>
        <dt>Reportante</dt>
        <dd>
          {{ incidencia.datosReportante.nombre }}
          <small v-if="incidencia.datosReportante.perfil">({{ incidencia.datosReportante.perfil }})</small>
        </dd>
      </div>
      <div>
        <dt>Técnico asignado</dt>
        <dd v-if="incidencia.tecnicoAsignado">{{ incidencia.tecnicoAsignado.nombre }}</dd>
        <dd v-else class="sin">Sin asignar</dd>
      </div>
      <div>
        <dt>Horas invertidas</dt>
        <dd>{{ incidencia.horasInvertidas }} h</dd>
      </div>
    </dl>

    <template v-if="detalle.length">
      <h3>Detalles de la categoría</h3>
      <dl class="datos" data-seccion="detalle">
        <div v-for="d in detalle" :key="d.clave">
          <dt>{{ d.etiqueta }}</dt>
          <dd>{{ d.valor }}</dd>
        </div>
      </dl>
    </template>

    <template v-if="incidencia.tags.length">
      <h3>Etiquetas</h3>
      <div class="tags">
        <Tag v-for="t in incidencia.tags" :key="t" :value="t" :title="t" severity="secondary" rounded />
      </div>
    </template>

    <template v-if="externo">
      <h3>Proveedor externo</h3>
      <dl class="datos" data-seccion="externo">
        <div>
          <dt>Empresa</dt>
          <dd>{{ externo.empresaProveedor }}</dd>
        </div>
        <div v-if="externo.nombreTecnico">
          <dt>Técnico responsable</dt>
          <dd>{{ externo.nombreTecnico }}</dd>
        </div>
        <div v-if="externo.contacto">
          <dt>Contacto</dt>
          <dd>{{ externo.contacto }}</dd>
        </div>
        <div>
          <dt>Orden de servicio</dt>
          <dd>{{ externo.ordenServicioRef }}</dd>
        </div>
      </dl>
    </template>
  </section>
</template>

<style scoped>
h2 {
  margin-bottom: 8px;
}
h3 {
  margin: 20px 0 8px;
  font-size: 0.9rem;
  color: var(--on-surface-variant);
}
.descripcion {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.datos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px 24px;
  margin: 20px 0 0;
}
h3 + .datos {
  margin-top: 0;
}
.datos div {
  min-width: 0;
}
dt {
  font-size: 0.75rem;
  color: var(--on-surface-variant);
}
dd {
  margin: 2px 0 0;
  font-weight: 500;
  overflow-wrap: anywhere;
}
dd small {
  font-weight: 400;
  color: var(--on-surface-variant);
}
.sin {
  color: var(--on-surface-variant);
  font-weight: 400;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}
.tags > * {
  max-width: 100%;
}
</style>
