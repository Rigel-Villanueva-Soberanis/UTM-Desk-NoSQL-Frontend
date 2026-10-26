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
