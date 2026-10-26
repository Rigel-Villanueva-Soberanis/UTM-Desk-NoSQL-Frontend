<script setup lang="ts">
withDefaults(defineProps<{ icono?: string; titulo?: string; texto?: string }>(), {
  icono: 'pi pi-inbox',
  titulo: 'Sin información',
  texto: '',
})
</script>

<template>
  <div class="vacia">
    <i :class="icono" />
    <h3>{{ titulo }}</h3>
    <p v-if="texto">{{ texto }}</p>
    <slot />
  </div>
</template>

<style scoped>
.vacia {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 16px;
  text-align: center;
  color: var(--on-surface-variant);
  max-width: 100%;
  overflow-wrap: anywhere;
}
.vacia i {
  font-size: 2rem;
  color: var(--tint);
}
</style>
