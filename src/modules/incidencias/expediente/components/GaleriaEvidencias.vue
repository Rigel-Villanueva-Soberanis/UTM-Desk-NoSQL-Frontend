<script setup lang="ts">
import Image from 'primevue/image'
import { esImagen } from '@/core/utils/archivos'
import { formatearFecha } from '@/core/utils/fechas'
import PantallaVacia from '@/shared/components/PantallaVacia.vue'
import type { EvidenciaAdjunta } from '../../types/incidencia.types'

defineProps<{ evidencias: EvidenciaAdjunta[] }>()
</script>

<template>
  <section class="bloque">
    <h2>Evidencias <small v-if="evidencias.length">({{ evidencias.length }})</small></h2>

    <PantallaVacia v-if="!evidencias.length" icono="pi pi-images" titulo="Sin evidencias" texto="Aún no se han adjuntado fotos ni documentos." />

    <ul v-else class="galeria">
      <li v-for="e in evidencias" :key="e.publicId" class="evidencia">
        <Image
          v-if="esImagen(`x.${e.formato}`)"
          :src="e.urlStorage"
          :alt="e.nombreArchivo"
          preview
          image-class="foto"
          class="visor"
        />
        <a
          v-else
          :href="e.urlStorage"
          target="_blank"
          rel="noopener noreferrer"
          class="documento"
          :title="`Abrir ${e.nombreArchivo}`"
        >
          <i class="pi pi-file-pdf" />
          <span>Abrir PDF</span>
        </a>
        <p class="nombre" :title="e.nombreArchivo">{{ e.nombreArchivo }}</p>
        <p class="autor">
          {{ e.subidoPor.nombre }} · {{ formatearFecha(e.fechaCarga) }}
        </p>
      </li>
    </ul>
  </section>
</template>

<style scoped>
h2 small {
  font-weight: 400;
  color: var(--on-surface-variant);
}
.galeria {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}
.evidencia {
  min-width: 0;
}
.visor {
  display: block;
}
:deep(.foto) {
  width: 100%;
  height: 130px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid var(--outline-variant);
}
.documento {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 130px;
  border-radius: 10px;
  background: var(--error-container);
  color: var(--on-error-container);
  text-decoration: none;
  font-weight: 600;
}
.documento .pi {
  font-size: 2rem;
}
.nombre {
  margin-top: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}
.autor {
  overflow-wrap: anywhere;
  font-size: 0.75rem;
  color: var(--on-surface-variant);
}
</style>
