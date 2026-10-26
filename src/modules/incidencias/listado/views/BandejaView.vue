<script setup lang="ts">
import { ref } from 'vue'
import Button from 'primevue/button'
import { refrescarContadores } from '@/core/layout/useContadores'
import PantallaVacia from '@/shared/components/PantallaVacia.vue'
import AsignarDialog from '../../gestion/components/AsignarDialog.vue'
import type { IncidenciaResumen } from '../../types/incidencia.types'
import FiltrosIncidencias from '../components/FiltrosIncidencias.vue'
import TablaIncidencias from '../components/TablaIncidencias.vue'
import { useListadoIncidencias } from '../composables/useListadoIncidencias'

// La bandeja es el listado con `asignada=false` fijo: las que ya tienen técnico salen solas.
const { filtros, datos, cargando, error, hayFiltros, aplicarFiltros, irAPagina, limpiar, recargar } =
  useListadoIncidencias({ ruta: 'bandeja', fijos: { asignada: 'false' } })

/** Tras asignar: recarga la lista y actualiza las insignias del menú. */
const alActualizar = () => {
  void recargar()
  void refrescarContadores({ total: true, sinAsignar: true }, true)
}

const paraAsignar = ref<IncidenciaResumen | null>(null)
const asignar = (i: IncidenciaResumen) => (paraAsignar.value = i)
</script>

<template>
  <section>
    <div class="pagina-titulo">
      <h1>Bandeja sin asignar</h1>
      <p>Incidencias que todavía no tienen técnico. Asigna uno y saldrán de esta lista.</p>
    </div>

    <div class="tarjeta-base bloque">
      <FiltrosIncidencias
        :model-value="filtros"
        :hay-filtros="hayFiltros"
        ocultar-asignada
        @cambiar="aplicarFiltros"
        @limpiar="limpiar"
      />
    </div>

    <div v-if="error" class="tarjeta-base bloque">
      <PantallaVacia icono="pi pi-exclamation-triangle" titulo="No se pudo cargar la bandeja" :texto="error">
        <Button label="Reintentar" icon="pi pi-refresh" severity="secondary" @click="recargar" />
      </PantallaVacia>
    </div>

    <div v-else class="tarjeta-base bloque tabla">
      <TablaIncidencias
        bandeja
        :items="datos?.items ?? []"
        :cargando="cargando"
        :total="datos?.total ?? 0"
        :pagina="filtros.pagina"
        :tamano-pagina="filtros.tamanoPagina"
        :hay-filtros="hayFiltros"
        titulo-vacio="Todo está asignado"
        texto-vacio="No hay incidencias esperando técnico."
        @paginar="irAPagina"
        @limpiar="limpiar"
        @asignar="asignar"
      />
    </div>

    <AsignarDialog
      v-if="paraAsignar"
      :incidencia="{ ...paraAsignar, tecnicoAsignado: null }"
      @cerrar="paraAsignar = null"
      @actualizar="alActualizar"
    />
  </section>
</template>

<style scoped>
.bloque {
  margin-bottom: 16px;
}
.tabla {
  padding: 0;
  overflow: hidden;
}
</style>
