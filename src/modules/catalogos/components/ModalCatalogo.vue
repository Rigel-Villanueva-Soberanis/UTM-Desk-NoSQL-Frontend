<script setup lang="ts">
import { useId } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'

/**
 * Cascarón de los modales de catálogos (edificios, salones…): franja de color, ícono, título y descripción
 * arriba; cuerpo con scroll; pie con el estado del formulario y los botones Cancelar / Guardar.
 * Enter dentro de un campo de una línea NO envía el formulario: se guarda con el botón.
 */
withDefaults(
  defineProps<{
    titulo: string
    descripcion?: string
    icono?: string
    etiquetaGuardar?: string
    iconoGuardar?: string
    enviando?: boolean
    /** Bloquea «Guardar» (nada que guardar o faltan datos). */
    sinCambios?: boolean
    mensaje?: string
    /** Texto del estado del pie (p. ej. «Campos requeridos completos»). */
    estado?: string
    estadoOk?: boolean
    ancho?: string
  }>(),
  {
    descripcion: '',
    icono: 'pi pi-building',
    etiquetaGuardar: 'Guardar',
    iconoGuardar: 'pi pi-check',
    enviando: false,
    sinCambios: false,
    mensaje: '',
    estado: '',
    estadoOk: false,
    ancho: '36rem',
  },
)

const visible = defineModel<boolean>('visible', { default: true })
const emit = defineEmits<{ guardar: []; cerrado: [] }>()
const idForm = useId()
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    :draggable="false"
    :show-header="false"
    :closable="false"
    :close-on-escape="!enviando"
    :dismissable-mask="false"
    :style="{ width: ancho }"
    :breakpoints="{ '640px': '96vw' }"
    :pt="{ content: { style: 'padding: 0; overflow: hidden; display: flex; flex-direction: column' } }"
    @after-hide="emit('cerrado')"
  >
    <span class="franja" aria-hidden="true" />
    <header class="cabeza">
      <span class="icono"><i :class="icono" /></span>
      <div class="titulos">
        <div class="linea-titulo">
          <h2>{{ titulo }}</h2>
          <slot name="titulo-extra" />
        </div>
        <p v-if="descripcion">{{ descripcion }}</p>
      </div>
      <Button icon="pi pi-times" text rounded severity="secondary" :disabled="enviando" aria-label="Cerrar" title="Cerrar" @click="visible = false" />
    </header>

    <form :id="idForm" class="cuerpo" novalidate @submit.prevent="!enviando && !sinCambios && emit('guardar')">
      <Message v-if="mensaje" severity="error" :closable="false" class="mensaje">{{ mensaje }}</Message>
      <slot />
    </form>

    <footer class="pie">
      <span v-if="estado" class="estado" :class="{ ok: estadoOk }"><span class="punto" />{{ estado }}</span>
      <span class="botones">
        <Button label="Cancelar" severity="secondary" text type="button" :disabled="enviando" @click="visible = false" />
        <Button type="submit" :form="idForm" :label="etiquetaGuardar" :icon="iconoGuardar" :loading="enviando" :disabled="sinCambios" />
      </span>
    </footer>
  </Dialog>
</template>

<style scoped>
.franja {
  display: block;
  height: 6px;
  background: linear-gradient(90deg, #2563eb, #4f46e5, #0ea5e9);
}
.cabeza {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 20px 20px 16px 24px;
  border-bottom: 1px solid var(--outline-variant, rgba(100, 116, 139, 0.2));
}
.icono {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-size: 1.3rem;
  color: #2563eb;
  background: color-mix(in srgb, #2563eb 10%, transparent);
  border: 1px solid color-mix(in srgb, #2563eb 25%, transparent);
}
.titulos {
  flex: 1;
  min-width: 0;
}
.linea-titulo {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 10px;
}
h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  line-height: 1.3;
}
p {
  margin: 4px 0 0;
  font-size: 0.85rem;
  line-height: 1.45;
  color: var(--on-surface-variant);
  overflow-wrap: anywhere;
}
.cuerpo {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 20px 24px;
  overflow-y: auto;
  max-height: calc(88vh - 14rem);
}
.mensaje :deep(.p-message-text) {
  overflow-wrap: anywhere;
}
.pie {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding: 14px 24px;
  background: var(--surface-low);
  border-top: 1px solid var(--outline-variant, rgba(100, 116, 139, 0.2));
}
.estado {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: var(--on-surface-variant);
}
.punto {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #94a3b8;
}
.estado.ok .punto {
  background: #10b981;
}
.botones {
  display: flex;
  gap: 8px;
  margin-left: auto;
}
</style>
