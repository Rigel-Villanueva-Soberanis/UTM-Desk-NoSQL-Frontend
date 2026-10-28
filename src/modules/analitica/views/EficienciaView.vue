<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import MultiSelect from 'primevue/multiselect'
import Select from 'primevue/select'
import Skeleton from 'primevue/skeleton'
import { ESTADOS, type Estado } from '@/modules/incidencias/types/incidencia.types'
import { useCatalogos } from '@/modules/catalogos/composables/useCatalogos'
import PantallaVacia from '@/shared/components/PantallaVacia.vue'
import RangoFechas from '@/shared/components/RangoFechas.vue'
import GraficaBase from '../components/GraficaBase.vue'
import TarjetaKpi from '../components/TarjetaKpi.vue'
import { useEficiencia } from '../composables/useEficiencia'
import { opcionesBarras, PALETA } from '../utils/graficas'

const { categorias, nombresEdificio } = useCatalogos()
const { filtros, hayFiltros, datos, cargando, error, aplicar, limpiar, recargar } = useEficiencia()

const num = (n: number, max = 2) => Number(n ?? 0).toLocaleString('es-MX', { maximumFractionDigits: max })

// ── Top 10 etiquetas (barras horizontales) ──
const tags = computed(() => (datos.value?.topTags ?? []).slice(0, 10))
const tagsNombres = computed(() => tags.value.map((t) => t.tag))
const graficaTags = computed(() => ({
  labels: tagsNombres.value,
  datasets: [{ label: 'Incidencias', data: tags.value.map((t) => t.total), backgroundColor: PALETA[0], borderRadius: 6, maxBarThickness: 28 }],
}))
const opcionesTags = computed(() => opcionesBarras({ horizontal: true, entero: true, tituloValor: 'Incidencias', etiquetas: tagsNombres.value }))
const descTags = computed(() => 'Etiquetas más usadas: ' + tags.value.map((t) => `${t.tag} ${t.total}`).join('; '))

// ── Dona por empresa externa (las más pequeñas se agrupan en «Otras») ──
const MAX_EMPRESAS = 7
const empresas = computed(() => {
  const l = [...(datos.value?.proveedoresExternos.porEmpresa ?? [])].sort((a, b) => b.total - a.total)
  if (l.length <= MAX_EMPRESAS + 1) return l
  const resto = l.slice(MAX_EMPRESAS).reduce((s, e) => s + e.total, 0)
  return [...l.slice(0, MAX_EMPRESAS), { empresa: 'Otras', total: resto }]
})
const graficaEmpresas = computed(() => ({
  labels: empresas.value.map((e) => e.empresa),
  datasets: [{ data: empresas.value.map((e) => e.total), backgroundColor: empresas.value.map((_, i) => PALETA[i % PALETA.length]), borderWidth: 2, borderColor: '#fff' }],
}))
const opcionesEmpresas = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '62%',
  plugins: { legend: { position: 'bottom' as const, labels: { boxWidth: 12, font: { family: "'Inter Variable', Inter, system-ui, sans-serif", size: 12 }, color: '#44474d' } } },
}
const descEmpresas = computed(() => 'Casos con proveedor externo por empresa: ' + empresas.value.map((e) => `${e.empresa} ${e.total}`).join('; '))
const sinDatos = computed(() => !!datos.value && datos.value.totalIncidencias === 0)
</script>

<template>
  <section>
    <div class="pagina-titulo">
      <h1>Eficiencia global</h1>
      <p>Horas hombre, etiquetas más frecuentes y uso de proveedores externos.</p>
    </div>

    <form class="tarjeta-base filtros" aria-label="Filtros" @submit.prevent>
      <div class="rejilla">
        <RangoFechas
          id-base="e-fecha"
          etiqueta-desde="Creada desde"
          etiqueta-hasta="Creada hasta"
          :desde="filtros.fechaDesde"
          :hasta="filtros.fechaHasta"
          @cambiar="aplicar"
        />
        <div class="campo">
          <label for="e-categoria">Categoría</label>
          <Select
            input-id="e-categoria"
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
          <label for="e-edificio">Edificio</label>
          <Select
            input-id="e-edificio"
            :model-value="filtros.edificio || null"
            :options="nombresEdificio"
            placeholder="Todos"
            show-clear
            fluid
            @update:model-value="(v) => aplicar({ edificio: v ?? '' })"
          />
        </div>
        <div class="campo">
          <label for="e-estado">Estado</label>
          <MultiSelect
            input-id="e-estado"
            :model-value="filtros.estado"
            :options="ESTADOS"
            option-label="etiqueta"
            option-value="valor"
            placeholder="Todos"
            display="chip"
            :max-selected-labels="3"
            selected-items-label="{0} estados"
            :show-toggle-all="false"
            fluid
            @update:model-value="(v: Estado[]) => aplicar({ estado: v })"
          />
        </div>
      </div>
      <p class="mostrando" aria-live="polite">
        Mostrando: <strong>{{ filtros.estado.length ? filtros.estado.join(', ') : 'Todos' }}</strong>
      </p>
      <div v-if="hayFiltros" class="pie">
        <Button label="Limpiar filtros" icon="pi pi-filter-slash" severity="secondary" text size="small" @click="limpiar" />
      </div>
    </form>

    <div v-if="cargando && !datos" class="cargando" aria-busy="true">
      <div class="kpis"><Skeleton v-for="n in 4" :key="n" height="6rem" /></div>
      <Skeleton height="18rem" />
    </div>

    <div v-else-if="error" class="tarjeta-base">
      <PantallaVacia icono="pi pi-exclamation-triangle" titulo="No se pudo cargar la eficiencia" :texto="error">
        <Button label="Reintentar" icon="pi pi-refresh" severity="secondary" @click="recargar" />
      </PantallaVacia>
    </div>

    <div v-else-if="sinDatos" class="tarjeta-base">
      <PantallaVacia
        icono="pi pi-chart-bar"
        titulo="Sin incidencias"
        :texto="hayFiltros ? 'No hay incidencias con esos filtros.' : 'Todavía no hay incidencias para analizar.'"
      >
        <Button v-if="hayFiltros" label="Limpiar filtros" severity="secondary" size="small" @click="limpiar" />
      </PantallaVacia>
    </div>

    <template v-else-if="datos">
      <div class="kpis" :class="{ 'cargando-datos': cargando }">
        <TarjetaKpi etiqueta="Incidencias" :valor="num(datos.totalIncidencias, 0)" icono="pi pi-list" detalle="en el periodo" />
        <TarjetaKpi
          etiqueta="Tiempo hombre"
          :valor="datos.tiempoHombreTotal.texto"
          icono="pi pi-clock"
          :detalle="`en ${num(datos.incidenciasConHoras, 0)} incidencias con horas`"
        />
        <TarjetaKpi etiqueta="Promedio por incidencia" :valor="datos.promedioPorIncidencia.texto" icono="pi pi-chart-line" detalle="tiempo por incidencia" />
        <TarjetaKpi
          etiqueta="Con proveedor externo"
          :valor="`${num(datos.proveedoresExternos.porcentaje, 1)} %`"
          icono="pi pi-building"
          :detalle="`${num(datos.proveedoresExternos.totalCasos, 0)} ${datos.proveedoresExternos.totalCasos === 1 ? 'caso' : 'casos'}`"
        />
      </div>

      <div class="graficas" :class="{ 'cargando-datos': cargando }">
        <div class="tarjeta-base">
          <h2>Top 10 etiquetas</h2>
          <GraficaBase
            v-if="tags.length"
            tipo="bar"
            :datos="graficaTags"
            :opciones="opcionesTags"
            :descripcion="descTags"
            :alto="`${Math.max(200, tags.length * 36 + 60)}px`"
          />
          <PantallaVacia v-else icono="pi pi-tags" titulo="Sin etiquetas" texto="Ninguna incidencia del periodo tiene etiquetas." />
        </div>

        <div class="tarjeta-base">
          <h2>Casos por empresa externa</h2>
          <GraficaBase
            v-if="empresas.length"
            tipo="doughnut"
            :datos="graficaEmpresas"
            :opciones="opcionesEmpresas"
            :descripcion="descEmpresas"
            alto="320px"
          />
          <PantallaVacia v-else icono="pi pi-building" titulo="Sin proveedores externos" texto="No se usaron proveedores externos en el periodo." />
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.mostrando {
  margin: 12px 0 0;
  color: var(--on-surface-variant);
  font-size: 0.85rem;
}
.mostrando strong {
  color: var(--on-surface);
}
.filtros {
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
.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}
.cargando {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.graficas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 16px;
  align-items: start;
}
.graficas h2 {
  margin-bottom: 12px;
  font-size: 1rem;
}
.cargando-datos {
  opacity: 0.6;
  transition: opacity 0.15s;
}
@media (max-width: 420px) {
  .graficas {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
