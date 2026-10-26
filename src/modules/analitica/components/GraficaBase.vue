<script setup lang="ts">
import Chart from 'primevue/chart'

/** Gráfica con descripción accesible (`role="img"`) y alto fijo; ancho mínimo para que no se aplasten las barras. */
withDefaults(
  defineProps<{
    tipo: 'bar' | 'doughnut'
    datos: object
    opciones: object
    /** Texto que leen los lectores de pantalla (resumen de los datos). */
    descripcion: string
    alto?: string
    anchoMinimo?: string
  }>(),
  { alto: '320px', anchoMinimo: '0' },
)
</script>

<template>
  <div class="desplazable">
    <div class="caja" role="img" :aria-label="descripcion" :style="{ height: alto, minWidth: anchoMinimo }">
      <Chart :type="tipo" :data="datos" :options="opciones" class="chart" />
    </div>
  </div>
</template>

<style scoped>
.desplazable {
  overflow-x: auto;
}
.caja {
  position: relative;
}
.chart,
.chart :deep(canvas) {
  width: 100% !important;
  height: 100% !important;
}
</style>
