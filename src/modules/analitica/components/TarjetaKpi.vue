<script setup lang="ts">
defineProps<{ etiqueta: string; valor: string; detalle?: string; icono: string }>()
</script>

<template>
  <article class="kpi">
    <i :class="icono" class="icono" aria-hidden="true" />
    <div class="texto">
      <p class="etiqueta">{{ etiqueta }}</p>
      <p class="valor" :title="valor">{{ valor }}</p>
      <p v-if="detalle" class="detalle">{{ detalle }}</p>
    </div>
  </article>
</template>

<style scoped>
.kpi {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  min-width: 0;
  padding: 18px;
  background: var(--card);
  border: 1px solid var(--outline-variant);
  border-radius: 12px;
}
.icono {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--surface-container);
  color: var(--accent);
  font-size: 1.1rem;
}
.texto {
  min-width: 0;
}
.etiqueta {
  color: var(--on-surface-variant);
  font-size: 0.8rem;
  font-weight: 600;
}
.valor {
  margin: 2px 0;
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
  overflow-wrap: anywhere;
}
.detalle {
  color: var(--on-surface-variant);
  font-size: 0.8rem;
}
</style>
