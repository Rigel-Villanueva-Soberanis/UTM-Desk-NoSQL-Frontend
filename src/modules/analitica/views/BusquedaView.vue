<script setup lang="ts">
import { ref, watch } from 'vue'
import Button from 'primevue/button'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import { acortar } from '@/core/utils/validacion'
import CampoError from '@/shared/components/CampoError.vue'
import PantallaVacia from '@/shared/components/PantallaVacia.vue'
import FiltrosIncidencias from '@/modules/incidencias/listado/components/FiltrosIncidencias.vue'
import TablaIncidencias from '@/modules/incidencias/listado/components/TablaIncidencias.vue'
import { Q_MAX, useBusqueda } from '../composables/useBusqueda'

const {
  filtros,
  q,
  hayBusqueda,
  hayFiltros,
  datos,
  cargando,
  error,
  errorQ,
  enviar,
  aplicarFiltros,
  irAPagina,
  limpiarFiltros,
  limpiarBusqueda,
  recargar,
} = useBusqueda()

/** Lo que hay escrito en la barra (arranca con lo que traiga la URL). */
const entrada = ref(q.value)
watch(q, (v) => (entrada.value = v))
watch(entrada, () => (errorQ.value = ''))

const buscar = () => enviar(entrada.value)
const quitar = () => {
  entrada.value = ''
  limpiarBusqueda()
}
</script>

<template>
  <section>
    <div class="pagina-titulo">
      <h1>Búsqueda</h1>
      <p>Aquí ves todas las incidencias. Escribe para buscar en el título y la descripción (de la más relevante a la menos) y usa los filtros para afinar.</p>
    </div>

    <form class="tarjeta-base barra" role="search" novalidate @submit.prevent="buscar">
      <div class="entrada">
        <IconField>
          <InputIcon class="pi pi-search" />
          <InputText
            id="busqueda"
            v-model="entrada"
            class="grande"
            type="search"
            :maxlength="Q_MAX"
            placeholder="Ej. pantalla azul, &quot;sin internet&quot;, red -impresora"
            aria-label="Texto a buscar"
            :invalid="!!errorQ"
            autocomplete="off"
            autofocus
            fluid
          />
        </IconField>
        <Button type="submit" label="Buscar" icon="pi pi-search" :loading="cargando" />
      </div>
      <CampoError :mensaje="errorQ" />
      <p class="ayuda">
        Usa <code>"frase exacta"</code> para buscar las palabras juntas y <code>-palabra</code> para excluir.
        De 2 a {{ Q_MAX }} caracteres.
      </p>
    </form>

    <div class="tarjeta-base bloque">
      <FiltrosIncidencias
        :model-value="filtros"
        :hay-filtros="hayFiltros"
        @cambiar="aplicarFiltros"
        @limpiar="limpiarFiltros"
      />
    </div>

    <!-- Error -->
    <div v-if="error" class="tarjeta-base bloque">
      <PantallaVacia icono="pi pi-exclamation-triangle" titulo="No se pudo buscar" :texto="error">
        <Button label="Reintentar" icon="pi pi-refresh" severity="secondary" @click="recargar" />
      </PantallaVacia>
    </div>

    <!-- Resultados -->
    <template v-else>
      <p v-if="datos && !cargando" class="resumen" aria-live="polite">
        {{ datos.total }} {{ datos.total === 1 ? 'resultado' : 'resultados' }}<template v-if="hayBusqueda"> para
        «<strong class="termino" :title="q">{{ acortar(q, 60) }}</strong>»</template>
        <Button v-if="hayBusqueda && datos.total" label="Quitar búsqueda" icon="pi pi-times" severity="secondary" text size="small" @click="quitar" />
      </p>
      <div class="tarjeta-base bloque tabla">
        <TablaIncidencias
          :items="datos?.items ?? []"
          :cargando="cargando"
          :total="datos?.total ?? 0"
          :pagina="filtros.pagina"
          :tamano-pagina="filtros.tamanoPagina"
          :hay-filtros="hayFiltros"
          :relevancia="hayBusqueda"
          titulo-vacio="Sin resultados"
          :texto-vacio="hayBusqueda ? `Ninguna incidencia coincide con «${acortar(q, 60)}». Prueba con otras palabras o quita alguna exclusión.` : 'No hay incidencias con esos filtros.'"
          @paginar="irAPagina"
          @limpiar="limpiarFiltros"
        />
      </div>
    </template>
  </section>
</template>

<style scoped>
.barra {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}
.entrada {
  display: flex;
  gap: 12px;
}
.entrada :deep(.p-iconfield) {
  flex: 1;
  min-width: 0;
}
.grande {
  height: 3rem;
  font-size: 1rem;
}
.ayuda {
  color: var(--on-surface-variant);
  font-size: 0.8rem;
}
code {
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--surface-container);
}
.bloque {
  margin-bottom: 16px;
}
.tabla {
  padding: 0;
  overflow: hidden;
}
.resumen {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  color: var(--on-surface-variant);
}
.termino {
  color: var(--on-surface);
  overflow-wrap: anywhere;
}
@media (max-width: 640px) {
  .entrada {
    flex-direction: column;
  }
}
</style>
