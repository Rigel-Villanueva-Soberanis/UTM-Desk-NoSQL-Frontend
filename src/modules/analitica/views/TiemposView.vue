<script setup lang="ts">
import { computed } from 'vue'
import { aHoras } from '@/core/types/tiempo'
import type { TiempoEdificio } from '../types/analitica.types'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Message from 'primevue/message'
import Select from 'primevue/select'
import Skeleton from 'primevue/skeleton'
import { useCatalogos } from '@/modules/catalogos/composables/useCatalogos'
import { PRIORIDADES } from '@/modules/incidencias/types/incidencia.types'
import PantallaVacia from '@/shared/components/PantallaVacia.vue'
import RangoFechas from '@/shared/components/RangoFechas.vue'
import GraficaBase from '../components/GraficaBase.vue'
import { useTiempos } from '../composables/useTiempos'
import { opcionesBarras, PALETA } from '../utils/graficas'

const { categorias } = useCatalogos()
const { filtros, hayFiltros, datos, cargando, error, aplicar, limpiar, recargar } = useTiempos()

const ORDENES = [
  { valor: 'reportes', etiqueta: 'Más reportes' },
  { valor: 'tiempo', etiqueta: 'Mayor tiempo promedio' },
]


const etiquetas = computed(() => datos.value.map((d) => d.edificio))

const grafica = computed(() => ({
  labels: etiquetas.value,
  datasets: [
    {
      label: 'Tiempo promedio (horas)',
      data: datos.value.map((d) => aHoras(d.tiempoPromedio)),
      backgroundColor: PALETA[0],
      borderRadius: 6,
      maxBarThickness: 56,
    },
  ],
}))
const opciones = computed(() =>
  opcionesBarras({
    tituloValor: 'Tiempo promedio',
    valorTexto: (i) => datos.value[i]?.tiempoPromedio.texto ?? '',
    etiquetas: etiquetas.value,
    extra: (i) => {
      const d = datos.value[i]
      return d ? [`Reportes: ${d.totalReportes}`, `Mínimo: ${d.tiempoMinimo.texto}`, `Máximo: ${d.tiempoMaximo.texto}`] : []
    },
  }),
)
const descripcion = computed(
  () => 'Tiempo promedio de resolución por edificio: ' + datos.value.map((d) => `${d.edificio} ${d.tiempoPromedio.texto}`).join('; '),
)
/** Con muchos edificios la gráfica se desplaza en horizontal en lugar de aplastar las barras. */
const anchoMinimo = computed(() => `${Math.max(0, datos.value.length * 72)}px`)
</script>

<template>
  <section>
    <div class="pagina-titulo">
      <h1>Tiempos por edificio</h1>
      <p>Cuánto tardan en resolverse las incidencias en cada edificio.</p>
    </div>

    <Message severity="info" :closable="false" class="nota">
      Solo cubre los <strong>últimos 60 días</strong>: las incidencias resueltas se eliminan solas pasado ese tiempo.
    </Message>

    <form class="tarjeta-base filtros" aria-label="Filtros" @submit.prevent>
      <div class="rejilla">
        <RangoFechas
          id-base="t-fecha"
          etiqueta-desde="Resuelta desde"
          etiqueta-hasta="Resuelta hasta"
          :desde="filtros.fechaDesde"
          :hasta="filtros.fechaHasta"
          @cambiar="aplicar"
        />
        <div class="campo">
          <label for="t-categoria">Categoría</label>
          <Select
            input-id="t-categoria"
            :model-value="filtros.categoria || null"
            :options="categorias"
            option-label="nombre"
            option-value="clave"
            placeholder="Todas"
            show-clear
            fluid
            @update:model-value="(v) => aplicar({ categoria: v ?? '' })"
          />
        </div>
        <div class="campo">
          <label for="t-prioridad">Prioridad</label>
          <Select
            input-id="t-prioridad"
            :model-value="filtros.prioridad || null"
            :options="PRIORIDADES"
            option-label="etiqueta"
            option-value="valor"
            placeholder="Todas"
            show-clear
            fluid
            @update:model-value="(v) => aplicar({ prioridad: v ?? '' })"
          />
        </div>
        <div class="campo">
          <label for="t-orden">Ordenar por</label>
          <Select
            input-id="t-orden"
            :model-value="filtros.ordenarPor"
            :options="ORDENES"
            option-label="etiqueta"
            option-value="valor"
            fluid
            @update:model-value="(v) => aplicar({ ordenarPor: v ?? 'reportes' })"
          />
        </div>
      </div>
      <div v-if="hayFiltros" class="pie">
        <Button label="Limpiar filtros" icon="pi pi-filter-slash" severity="secondary" text size="small" @click="limpiar" />
      </div>
    </form>

    <div v-if="cargando && !datos.length" class="tarjeta-base cargando" aria-busy="true">
      <Skeleton height="16rem" />
      <Skeleton height="8rem" />
    </div>

    <div v-else-if="error" class="tarjeta-base">
      <PantallaVacia icono="pi pi-exclamation-triangle" titulo="No se pudieron cargar los tiempos" :texto="error">
        <Button label="Reintentar" icon="pi pi-refresh" severity="secondary" @click="recargar" />
      </PantallaVacia>
    </div>

    <div v-else-if="!datos.length" class="tarjeta-base">
      <PantallaVacia
        icono="pi pi-chart-bar"
        titulo="Sin datos"
        :texto="hayFiltros ? 'No hay incidencias resueltas o cerradas con esos filtros.' : 'Todavía no hay incidencias resueltas o cerradas para calcular tiempos.'"
      >
        <Button v-if="hayFiltros" label="Limpiar filtros" severity="secondary" size="small" @click="limpiar" />
      </PantallaVacia>
    </div>

    <template v-else>
      <div class="tarjeta-base bloque" :class="{ 'cargando-datos': cargando }">
        <h2>Promedio de horas por edificio</h2>
        <GraficaBase tipo="bar" :datos="grafica" :opciones="opciones" :descripcion="descripcion" :ancho-minimo="anchoMinimo" />
      </div>

      <div class="tarjeta-base bloque tabla">
        <DataTable :value="datos" data-key="edificio" scrollable>
          <Column field="edificio" header="Edificio" style="min-width: 10rem">
            <template #body="{ data }"><span class="max-2-lineas" :title="data.edificio">{{ data.edificio }}</span></template>
          </Column>
          <Column field="totalReportes" header="Reportes" sortable style="min-width: 7rem" />
          <Column :field="(d: TiempoEdificio) => aHoras(d.tiempoPromedio)" header="Promedio" sortable style="min-width: 7rem">
            <template #body="{ data }">{{ data.tiempoPromedio.texto }}</template>
          </Column>
          <Column :field="(d: TiempoEdificio) => aHoras(d.tiempoMinimo)" header="Mínimo" sortable style="min-width: 7rem">
            <template #body="{ data }">{{ data.tiempoMinimo.texto }}</template>
          </Column>
          <Column :field="(d: TiempoEdificio) => aHoras(d.tiempoMaximo)" header="Máximo" sortable style="min-width: 7rem">
            <template #body="{ data }">{{ data.tiempoMaximo.texto }}</template>
          </Column>
          <Column :field="(d: TiempoEdificio) => aHoras(d.tiempoTrabajado)" header="Tiempo trabajado" sortable style="min-width: 9rem">
            <template #body="{ data }">{{ data.tiempoTrabajado.texto }}</template>
          </Column>
        </DataTable>
      </div>
    </template>
  </section>
</template>

<style scoped>
.nota {
  margin-bottom: 16px;
}
.filtros,
.bloque {
  margin-bottom: 16px;
}
.rejilla {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 16px;
}
.campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
label {
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--on-surface-variant);
}
.pie {
  margin-top: 12px;
}
.cargando {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.cargando-datos {
  opacity: 0.6;
  transition: opacity 0.15s;
}
.bloque h2 {
  margin-bottom: 12px;
  font-size: 1rem;
}
.tabla {
  padding: 0;
  overflow: hidden;
}
</style>
