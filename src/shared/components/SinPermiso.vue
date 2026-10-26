<script setup lang="ts">
withDefaults(defineProps<{ titulo?: string; texto?: string }>(), {
  titulo: 'Sin permiso',
  texto: 'Tu rol no tiene acceso a esta sección.',
})
</script>

<template>
  <section class="aviso">
    <i class="pi pi-lock" />
    <h1>{{ titulo }}</h1>
    <p>{{ texto }}</p>
    <RouterLink to="/">Volver al inicio</RouterLink>
  </section>
</template>

<style scoped>
.aviso {
  text-align: center;
  padding: 64px 16px;
}
.aviso i {
  font-size: 2.5rem;
  color: var(--tint);
}
.aviso h1 {
  margin-top: 12px;
}
.aviso p {
  margin: 8px 0 12px;
  color: var(--on-surface-variant);
}
</style>
