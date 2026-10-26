<script setup lang="ts">
import CampoError from './CampoError.vue'

/**
 * Envoltura estándar de un campo: etiqueta, control (slot), ayuda, error y contador de caracteres.
 * Marca el bloque con `.invalido` cuando hay error (así se puede llevar el foco al primero).
 */
defineProps<{
  /** `id` del control (enlaza la etiqueta con el campo). */
  id: string
  etiqueta: string
  requerido?: boolean
  opcional?: boolean
  error?: string
  ayuda?: string
  contador?: { actual: number; max: number }
}>()
</script>

<template>
  <div class="campo" :class="{ invalido: !!error }">
    <label :for="id">
      {{ etiqueta }}
      <span v-if="requerido" class="req" aria-hidden="true">*</span>
      <small v-else-if="opcional" class="opcional">(opcional)</small>
    </label>
    <slot />
    <small v-if="ayuda && !error" class="ayuda">{{ ayuda }}</small>
    <div v-if="error || contador" class="pie">
      <CampoError :mensaje="error" />
      <small v-if="contador" class="contador" :class="{ limite: contador.actual >= contador.max }">
        {{ contador.actual }}/{{ contador.max }}
      </small>
    </div>
  </div>
</template>

<style scoped>
.campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
label {
  font-weight: 600;
  overflow-wrap: anywhere;
}
.req {
  color: var(--error);
}
.opcional {
  font-weight: 400;
  color: var(--on-surface-variant);
}
.ayuda {
  color: var(--on-surface-variant);
}
.pie {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
.pie :deep(.campo-error) {
  margin-top: 0;
  min-width: 0;
}
.contador {
  margin-left: auto;
  flex-shrink: 0;
  color: var(--on-surface-variant);
}
.contador.limite {
  color: var(--error);
  font-weight: 600;
}
</style>
