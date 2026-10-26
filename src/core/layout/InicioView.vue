<script setup lang="ts">
import { ETIQUETA_ROL } from '@/core/auth/permisos'
import { useSesionStore } from '@/core/auth/sesion.store'

const sesion = useSesionStore()
</script>

<template>
  <section v-if="sesion.usuario">
    <div class="pagina-titulo">
      <h1>Hola, {{ sesion.usuario.nombreCompleto }}</h1>
      <p>Sesión iniciada como {{ ETIQUETA_ROL[sesion.usuario.rol] }}.</p>
    </div>
    <div class="tarjeta-base">
      <p>Selecciona una sección del menú para comenzar.</p>
    </div>
  </section>
</template>
