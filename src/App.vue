<script setup lang="ts">
import { RouterView } from 'vue-router'
import ConfirmDialog from 'primevue/confirmdialog'
import AvisoCentral from '@/shared/components/AvisoCentral.vue'
</script>

<template>
  <RouterView />
  <AvisoCentral />
  <ConfirmDialog />
</template>

<style>
/* Confirmaciones (eliminar): ancho fijo y alto según el texto; si es muy largo, se desplaza dentro del recuadro. */
.p-confirmdialog {
  width: 26rem;
  max-width: 92vw;
}
.p-confirmdialog .p-dialog-content {
  display: flex;
  align-items: center;
  gap: 16px;
}
.p-confirmdialog .p-confirmdialog-message {
  flex: 1;
  min-width: 0;
  max-height: 11rem;
  overflow-y: auto;
  overflow-wrap: anywhere;
}
</style>
