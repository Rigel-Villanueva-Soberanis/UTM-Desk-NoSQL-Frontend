<script setup lang="ts">
/**
 * Visor ÚNICO de imágenes de la app: se ve la imagen completa (sin scroll) en un cuadro con su nombre,
 * botones para girarla y, si hace falta, acciones propias en el pie (p. ej. «Eliminar») mediante el slot `acciones`.
 * Úsalo en cualquier lugar donde se abra una imagen.
 */
import { ref, watch } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'

const visible = defineModel<boolean>('visible', { default: false })
const props = defineProps<{ src: string; titulo?: string }>()

const giro = ref(0)
const girar = (grados: number) => (giro.value = (giro.value + grados + 360) % 360)
const de_lado = () => giro.value === 90 || giro.value === 270

// Cada vez que se abre (o cambia la imagen) vuelve a su orientación original.
watch(
  () => [visible.value, props.src],
  () => (giro.value = 0),
)
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    dismissable-mask
    :draggable="false"
    :header="titulo"
    :content-style="{ overflow: 'hidden' }"
    :style="{ width: 'min(92vw, 900px)' }"
  >
    <div class="lienzo">
      <img
        :src="src"
        :alt="titulo ?? ''"
        class="imagen"
        :class="{ lado: de_lado() }"
        :style="{ transform: `rotate(${giro}deg)` }"
      />
    </div>
    <template #footer>
      <div class="pie">
        <div class="giros" role="group" aria-label="Girar imagen">
          <Button icon="pi pi-replay" severity="secondary" text rounded aria-label="Girar a la izquierda" title="Girar a la izquierda" data-accion="visor-girar-izq" @click="girar(-90)" />
          <Button icon="pi pi-refresh" severity="secondary" text rounded aria-label="Girar a la derecha" title="Girar a la derecha" data-accion="visor-girar-der" @click="girar(90)" />
        </div>
        <div class="acciones">
          <slot name="acciones">
            <Button label="Cerrar" severity="secondary" text data-accion="visor-cerrar" @click="visible = false" />
          </slot>
        </div>
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.lienzo {
  container-type: size;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 68vh;
  overflow: hidden;
}
.imagen {
  display: block;
  max-width: 100cqw;
  max-height: 100cqh;
  width: auto;
  height: auto;
  object-fit: contain;
  transition: transform 0.2s;
}
/* De lado, el ancho y el alto se intercambian para que siga cabiendo completa */
.imagen.lado {
  max-width: 100cqh;
  max-height: 100cqw;
}
.pie {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
}
.giros,
.acciones {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
