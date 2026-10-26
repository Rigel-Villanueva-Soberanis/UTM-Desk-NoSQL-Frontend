<script setup lang="ts">
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import { usePermisos } from '@/core/auth/usePermisos'
import PantallaVacia from '@/shared/components/PantallaVacia.vue'
import FiltrosIncidencias from '../components/FiltrosIncidencias.vue'
import TablaIncidencias from '../components/TablaIncidencias.vue'
import { useListadoIncidencias } from '../composables/useListadoIncidencias'

const router = useRouter()
const { puede, rol } = usePermisos()
const {
  filtros,
  datos,
  cargando,
  error,
  titulo,
  descripcion,
  hayFiltros,
  aplicarFiltros,
  irAPagina,
  limpiar,
  recargar,
} = useListadoIncidencias()
</script>

<template>
  <section>
    <div class="pagina-titulo cabecera">
      <div>
        <h1>{{ titulo }}</h1>
        <p>{{ descripcion }}</p>
      </div>
      <Button
        v-if="puede('incidencias.crear')"
        label="Reportar falla"
        icon="pi pi-plus"
        @click="router.push('/incidencias/nueva')"
      />
    </div>

    <div class="tarjeta-base bloque">
      <FiltrosIncidencias
        :model-value="filtros"
        :hay-filtros="hayFiltros"
        @cambiar="aplicarFiltros"
        @limpiar="limpiar"
      />
    </div>

    <!-- Error -->
    <div v-if="error" class="tarjeta-base bloque">
      <PantallaVacia icono="pi pi-exclamation-triangle" titulo="No se pudo cargar el listado" :texto="error">
        <Button label="Reintentar" icon="pi pi-refresh" severity="secondary" @click="recargar" />
      </PantallaVacia>
    </div>

    <!-- Tabla (el técnico la ve agrupada por estado: su mesa de trabajo) -->
    <div v-else class="tarjeta-base bloque tabla">
      <TablaIncidencias
        :items="datos?.items ?? []"
        :cargando="cargando"
        :total="datos?.total ?? 0"
        :pagina="filtros.pagina"
        :tamano-pagina="filtros.tamanoPagina"
        :hay-filtros="hayFiltros"
        :agrupar="rol === 'tecnico'"
        :texto-vacio="puede('incidencias.crear') ? 'Cuando reportes una falla aparecerá aquí.' : 'Todavía no hay incidencias para mostrar.'"
        @paginar="irAPagina"
        @limpiar="limpiar"
      />
    </div>
  </section>
</template>

<style scoped>
.cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.bloque {
  margin-bottom: 16px;
}
.tabla {
  padding: 0;
  overflow: hidden;
}
@media (max-width: 640px) {
  .cabecera {
    flex-direction: column;
  }
}
</style>
