<script setup lang="ts">
import { useId } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'

/**
 * Cascarón común de los diálogos de gestión: modal, no se cierra mientras se guarda,
 * mensaje de error general arriba y botones Cancelar / Guardar abajo.
 * Enter dentro de un campo de una línea envía el formulario.
 */
withDefaults(
  defineProps<{
    titulo: string
    /** Contexto bajo el título (p. ej. folio y título de la incidencia). Se corta si es muy largo. */
    contexto?: string
    etiquetaGuardar?: string
    iconoGuardar?: string
    severidadGuardar?: 'primary' | 'danger'
    enviando?: boolean
    /** Bloquea "Guardar" (p. ej. mientras no hay nada que guardar). */
    sinCambios?: boolean
    mensaje?: string
    ancho?: string
  }>(),
  {
    contexto: '',
    etiquetaGuardar: 'Guardar',
    iconoGuardar: 'pi pi-check',
    severidadGuardar: 'primary',
    enviando: false,
    sinCambios: false,
    mensaje: '',
    ancho: '34rem',
  },
)

const visible = defineModel<boolean>('visible', { default: true })
const emit = defineEmits<{ guardar: []; cerrado: [] }>()
const idForm = useId()
</script>

<template>
  <Dialog
    v-model:visible="visible"
    :header="titulo"
    modal
    :draggable="false"
    :closable="!enviando"
    :close-on-escape="!enviando"
    :dismissable-mask="false"
    :style="{ width: ancho }"
    :breakpoints="{ '640px': '96vw' }"
    :pt="{ content: { style: 'padding-top: 4px' } }"
    @after-hide="emit('cerrado')"
  >
    <form :id="idForm" class="cuerpo" novalidate @submit.prevent="!enviando && !sinCambios && emit('guardar')">
      <p v-if="contexto" class="contexto max-2-lineas" :title="contexto">{{ contexto }}</p>
      <Message v-if="mensaje" severity="error" :closable="false" class="mensaje">{{ mensaje }}</Message>
      <slot />
    </form>

    <template #footer>
      <Button label="Cancelar" severity="secondary" text type="button" :disabled="enviando" @click="visible = false" />
      <Button
        type="submit"
        :form="idForm"
        :label="etiquetaGuardar"
        :icon="iconoGuardar"
        :severity="severidadGuardar === 'danger' ? 'danger' : undefined"
        :loading="enviando"
        :disabled="sinCambios"
      />
    </template>
  </Dialog>
</template>

<style scoped>
.cuerpo {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.contexto {
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--surface-low);
  color: var(--on-surface-variant);
  font-size: 0.85rem;
}
.mensaje :deep(.p-message-text) {
  overflow-wrap: anywhere;
}
</style>
