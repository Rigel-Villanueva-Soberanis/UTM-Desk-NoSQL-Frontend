<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { cerrarAviso, cola, type Severidad } from '@/core/http/avisos'

/**
 * Recuadro único de avisos, al centro de la pantalla: éxitos, errores, advertencias e información.
 * - Éxito: se cierra solo a los 4 s (o con «Aceptar»).
 * - Error / advertencia / información: esperan a que la persona pulse «Aceptar».
 * - Si llegan varios, se muestran uno tras otro («1 de 3»).
 */
const AUTO_CIERRE_MS = 4000
const actual = computed(() => cola.value[0] ?? null)

const ESTILO: Record<Severidad, { icono: string; clase: string; rol: 'alert' | 'status' }> = {
  success: { icono: 'pi pi-check-circle', clase: 'exito', rol: 'status' },
  error: { icono: 'pi pi-times-circle', clase: 'error', rol: 'alert' },
  warn: { icono: 'pi pi-exclamation-triangle', clase: 'advertencia', rol: 'alert' },
  info: { icono: 'pi pi-info-circle', clase: 'info', rol: 'status' },
}
const estilo = computed(() => ESTILO[actual.value?.severidad ?? 'info'])

const visible = computed({
  get: () => !!actual.value,
  set: (v) => {
    if (!v) cerrarAviso()
  },
})

// Los éxitos se cierran solos; el temporizador se reinicia con cada aviso nuevo.
const restante = ref(0)
let temporizador: ReturnType<typeof setTimeout> | undefined
watch(
  () => actual.value?.id,
  () => {
    clearTimeout(temporizador)
    const a = actual.value
    if (a?.severidad === 'success') {
      restante.value = AUTO_CIERRE_MS
      const id = a.id
      temporizador = setTimeout(() => {
        if (actual.value?.id === id) cerrarAviso()
      }, AUTO_CIERRE_MS)
    }
  },
  { immediate: true },
)
onBeforeUnmount(() => clearTimeout(temporizador))
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    :draggable="false"
    :closable="false"
    dismissable-mask
    close-on-escape
    :show-header="false"
    :style="{ width: '26rem' }"
    :breakpoints="{ '640px': '92vw' }"
    :pt="{ root: { 'data-aviso': actual?.severidad, role: estilo.rol === 'alert' ? 'alertdialog' : 'dialog' }, content: { style: 'padding: 28px 24px 8px' }, footer: { style: 'justify-content: center; padding: 8px 24px 24px' } }"
    :base-z-index="2000"
  >
    <div v-if="actual" :key="actual.id" class="aviso" :class="estilo.clase" :role="estilo.rol" aria-live="assertive">
      <i :class="estilo.icono" class="icono" aria-hidden="true" />
      <h2 class="titulo">{{ actual.titulo }}</h2>
      <p v-if="actual.detalle" class="detalle">{{ actual.detalle }}</p>
      <small v-if="cola.length > 1" class="cuenta">1 de {{ cola.length }}</small>
      <div v-if="actual.severidad === 'success'" class="barra" aria-hidden="true">
        <span class="relleno" :style="{ animationDuration: restante + 'ms' }" />
      </div>
    </div>
    <template #footer>
      <Button label="Aceptar" autofocus data-accion="aceptar-aviso" @click="cerrarAviso" />
    </template>
  </Dialog>
</template>

<style scoped>
.aviso {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
  min-width: 0;
}
.icono {
  font-size: 3rem;
}
.exito .icono {
  color: var(--success, #16a34a);
}
.error .icono {
  color: var(--error, #dc2626);
}
.advertencia .icono {
  color: #d97706;
}
.info .icono {
  color: var(--accent, #2563eb);
}
.titulo {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  overflow-wrap: anywhere;
}
.detalle {
  margin: 0;
  color: var(--on-surface-variant);
  overflow-wrap: anywhere;
  white-space: pre-line;
  max-height: 40vh;
  overflow-y: auto;
}
.cuenta {
  color: var(--on-surface-variant);
}
.barra {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: var(--surface-high, rgba(128, 128, 128, 0.2));
  overflow: hidden;
  margin-top: 6px;
}
.relleno {
  display: block;
  height: 100%;
  background: var(--success, #16a34a);
  animation-name: vaciar;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}
@keyframes vaciar {
  from {
    width: 100%;
  }
  to {
    width: 0;
  }
}
</style>
