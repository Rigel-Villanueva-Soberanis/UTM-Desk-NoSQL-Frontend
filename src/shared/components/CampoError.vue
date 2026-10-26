<script setup lang="ts">
defineProps<{ mensaje?: string }>()
</script>

<template>
  <small v-if="mensaje" class="campo-error" role="alert">{{ mensaje }}</small>
</template>

<style scoped>
.campo-error {
  display: block;
  margin-top: 4px;
  color: var(--error);
  font-size: 0.8rem;
}
</style>
