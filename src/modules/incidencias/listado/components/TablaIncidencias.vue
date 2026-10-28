<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable, { type DataTablePageEvent, type DataTableRowClickEvent } from 'primevue/datatable'
import { formatearDia, formatearHora } from '@/core/utils/fechas'
import EstadoBadge from '@/shared/components/EstadoBadge.vue'
import Skeleton from 'primevue/skeleton'
import PantallaVacia from '@/shared/components/PantallaVacia.vue'
import PrioridadBadge from '@/shared/components/PrioridadBadge.vue'
import { PAGINADOR } from '@/shared/config/paginador'
import { ESTADOS, type Estado, type IncidenciaResumen } from '../../types/incidencia.types'

/**
 * Tabla de incidencias que comparten el Listado (Paso 6/9) y la Búsqueda (Paso 10):
 * `agrupar` = mesa del técnico (agrupada por estado) · `relevancia` = columna extra de la búsqueda.
 */
const props = withDefaults(
  defineProps<{
    items: IncidenciaResumen[]
    cargando: boolean
    total: number
    pagina: number
    tamanoPagina: number
    hayFiltros: boolean
    agrupar?: boolean
    relevancia?: boolean
    /** Bandeja: con columna «Acciones». */
    bandeja?: boolean
    tituloVacio?: string
    textoVacio?: string
  }>(),
  { agrupar: false, relevancia: false, bandeja: false, tituloVacio: 'No hay incidencias', textoVacio: 'Todavía no hay incidencias para mostrar.' },
)
const emit = defineEmits<{ paginar: [pagina: number, filas: number]; limpiar: []; asignar: [incidencia: IncidenciaResumen] }>()

/** Una incidencia cerrada ya no admite técnico (el backend respondería 409). */
/** Anchos mínimos (rem): la bandeja los aprieta para que quepa la columna «Acciones» sin scroll lateral. */
const ancho = (normal: number, apretado: number) => ({ minWidth: `${props.bandeja ? apretado : normal}rem` })

const sePuedeAsignar = (i: IncidenciaResumen) => i.estado !== 'resuelta' && i.estado !== 'cerrada' && i.estado !== 'cancelada'

const router = useRouter()

/**
 * Mesa del técnico (Paso 9): agrupadas por estado, con «en proceso» primero.
 * El backend entrega las más recientes primero y ese orden se conserva dentro de cada grupo.
 * (El agrupado aplica a la página que se está viendo.)
 */
const ORDEN_MESA: Estado[] = ['en proceso', 'abierta', 'en espera', 'resuelta', 'cerrada', 'cancelada']
const filas = computed(() => {
  if (!props.agrupar) return props.items
  const peso = (e: Estado) => {
    const i = ORDEN_MESA.indexOf(e)
    return i < 0 ? ORDEN_MESA.length : i
  }
  return props.items.map((x, i) => ({ x, i })).sort((a, b) => peso(a.x.estado) - peso(b.x.estado) || a.i - b.i).map((o) => o.x)
})
const cuantos = (estado: string) => filas.value.filter((i) => i.estado === estado).length
const etiquetaEstado = (estado: string) => ESTADOS.find((e) => e.valor === estado)?.etiqueta ?? estado

/** Relevancia relativa a la mejor de la página (para la barrita). */
const maxRelevancia = computed(() => Math.max(0, ...props.items.map((i) => i.relevancia ?? 0)))
const porcentaje = (r: number | undefined) => (maxRelevancia.value > 0 ? Math.round(((r ?? 0) / maxRelevancia.value) * 100) : 0)

const primero = computed(() => (props.pagina - 1) * props.tamanoPagina)
const alHacerClic = (e: DataTableRowClickEvent) => router.push(`/incidencias/${(e.data as IncidenciaResumen).id}`)
const alPaginar = (e: DataTablePageEvent) => emit('paginar', e.page + 1, e.rows)
</script>

<template>
  <DataTable
    :value="filas"
    data-key="id"
    v-bind="PAGINADOR"
    lazy
    :rows="tamanoPagina"
    :first="primero"
    :total-records="total"
    :loading="cargando"
    row-hover
    :row-group-mode="agrupar ? 'subheader' : undefined"
    :group-rows-by="agrupar ? 'estado' : undefined"
    :row-class="() => 'fila'"
    scrollable
    @page="alPaginar"
    @row-click="alHacerClic"
  >
    <template #empty>
      <div v-if="cargando" class="esqueleto" aria-hidden="true">
        <Skeleton v-for="n in 5" :key="n" height="2.5rem" />
      </div>
      <template v-else>
      <PantallaVacia
        v-if="hayFiltros"
        icono="pi pi-filter-slash"
        titulo="Sin resultados"
        texto="Ninguna incidencia coincide con los filtros."
      >
        <Button label="Limpiar filtros" severity="secondary" size="small" @click="emit('limpiar')" />
      </PantallaVacia>
      <PantallaVacia v-else :titulo="tituloVacio" :texto="textoVacio" />
      </template>
    </template>

    <template #groupheader="{ data }">
      <div class="grupo" :data-grupo="data.estado">
        <EstadoBadge :estado="data.estado" />
        <span class="cuenta">{{ cuantos(data.estado) }} {{ cuantos(data.estado) === 1 ? 'incidencia' : 'incidencias' }} · {{ etiquetaEstado(data.estado) }}</span>
      </div>
    </template>

    <Column v-if="relevancia" header="Relevancia" style="min-width: 7rem">
      <template #body="{ data }">
        <div class="relevancia" :title="`Relevancia ${Number(data.relevancia ?? 0).toFixed(2)}`">
          <span class="barra"><span class="relleno" :style="{ width: porcentaje(data.relevancia) + '%' }" /></span>
          <span class="valor">{{ Number(data.relevancia ?? 0).toFixed(2) }}</span>
        </div>
      </template>
    </Column>
    <Column header="Folio" :style="ancho(8, 7)">
      <template #body="{ data }">
        <RouterLink :to="`/incidencias/${data.id}`" class="folio" @click.stop>{{ data.folio }}</RouterLink>
      </template>
    </Column>
    <Column header="Título" :style="ancho(11, 9)">
      <template #body="{ data }"><span class="celda una-linea c-titulo" :title="data.titulo">{{ data.titulo }}</span></template>
    </Column>
    <Column header="Estado" :style="ancho(7.5, 6.5)">
      <template #body="{ data }"><EstadoBadge :estado="data.estado" /></template>
    </Column>
    <Column header="Prioridad" :style="ancho(6.5, 5.5)">
      <template #body="{ data }"><PrioridadBadge :prioridad="data.prioridad" /></template>
    </Column>
    <Column header="Edificio / Aula" :style="ancho(7.5, 6.5)">
      <template #body="{ data }">
        <div class="doble">
          <span class="celda una-linea c-lugar" :title="data.edificio">{{ data.edificio }}</span>
          <small class="celda una-linea c-lugar" :title="data.aula">{{ data.aula }}</small>
        </div>
      </template>
    </Column>
    <Column header="Reportante" :style="ancho(7, 6)">
      <template #body="{ data }"><span class="celda una-linea c-reportante" :title="data.nombreReportante">{{ data.nombreReportante }}</span></template>
    </Column>
    <Column header="Fecha" :style="ancho(7.5, 7)">
      <template #body="{ data }">
        <div class="doble fecha">
          <span>{{ formatearDia(data.fechaCreacion) }}</span>
          <small>{{ formatearHora(data.fechaCreacion) }}</small>
        </div>
      </template>
    </Column>
    <Column v-if="bandeja" header="Acciones" style="min-width: 12rem; width: 12rem">
      <template #body="{ data }">
        <Button
          v-if="sePuedeAsignar(data)"
          label="Asignar técnico"
          icon="pi pi-user-plus"
          size="small"
          class="btn-asignar"
          data-accion="asignar"
          @click.stop="emit('asignar', data)"
        />
        <span v-else class="sin">Cerrada</span>
      </template>
    </Column>
  </DataTable>
</template>

<style scoped>
:deep(.fila) {
  cursor: pointer;
}
:deep(.p-datatable-tbody > tr > td),
:deep(.p-datatable-column-header-content) {
  padding-inline: 0.5rem;
}
.folio {
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
}
.folio:hover {
  text-decoration: underline;
}
/* Ninguna celda se estira más de 18rem: el texto largo se corta con "…" y el título (tooltip) lo muestra completo */
.celda {
  max-width: 18rem;
}
.celda.una-linea {
  display: block;
}
/* Una sola línea por celda: todas las filas miden lo mismo con textos cortos o largos */
.c-titulo {
  max-width: 14rem;
}
.c-reportante {
  max-width: 10rem;
}
.c-lugar {
  max-width: 10rem;
}
.fecha,
.fecha span,
.fecha small {
  white-space: nowrap;
}
.btn-asignar {
  white-space: nowrap;
  width: 100%;
}
.btn-asignar :deep(.p-button-label) {
  white-space: nowrap;
}
.grupo {
  display: flex;
  align-items: center;
  gap: 10px;
}
.cuenta {
  color: var(--on-surface-variant);
  font-weight: 500;
}
.doble {
  display: flex;
  flex-direction: column;
}
.doble small,
.sin {
  color: var(--on-surface-variant);
}
.relevancia {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.barra {
  display: block;
  width: 64px;
  height: 6px;
  border-radius: 3px;
  background: var(--surface-high);
  overflow: hidden;
}
.relleno {
  display: block;
  height: 100%;
  background: var(--accent);
}
.valor {
  font-weight: 600;
  font-size: 0.8rem;
}
.esqueleto {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
}
</style>
