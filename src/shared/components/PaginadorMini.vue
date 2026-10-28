<script setup lang="ts">
import { computed, watch } from 'vue'
import Button from 'primevue/button'

/**
 * Paginador pequeño para listas dentro de un modal («1–5 de 12», con anterior / siguiente).
 * No se muestra si todo cabe en una página. La página (desde 1) se enlaza con v-model.
 */
const props = defineProps<{ total: number; tamano: number }>()
const pagina = defineModel<number>({ default: 1 })

const paginas = computed(() => Math.max(1, Math.ceil(props.total / props.tamano)))
const desde = computed(() => (props.total ? (pagina.value - 1) * props.tamano + 1 : 0))
const hasta = computed(() => Math.min(props.total, pagina.value * props.tamano))

// Si la lista se acorta (filtro, quitar elementos), la página no se pasa del final.
watch(paginas, (n) => {
  if (pagina.value > n) pagina.value = n
})
</script>

<template>
  <div v-if="total > tamano" class="mini">
    <span class="rango">{{ desde }}–{{ hasta }} de {{ total }}</span>
    <span class="botones">
      <Button type="button" icon="pi pi-chevron-left" text rounded size="small" severity="secondary" :disabled="pagina <= 1" aria-label="Página anterior" @click="pagina--" />
      <span class="num">{{ pagina }} / {{ paginas }}</span>
      <Button type="button" icon="pi pi-chevron-right" text rounded size="small" severity="secondary" :disabled="pagina >= paginas" aria-label="Página siguiente" @click="pagina++" />
    </span>
  </div>
</template>

<style scoped>
.mini {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.78rem;
  color: var(--on-surface-variant);
}
.botones {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.num {
  min-width: 3.2rem;
  text-align: center;
  font-weight: 600;
}
</style>
