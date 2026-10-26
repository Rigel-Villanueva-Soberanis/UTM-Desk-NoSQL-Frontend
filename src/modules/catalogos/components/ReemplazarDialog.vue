<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Checkbox from 'primevue/checkbox'
import Message from 'primevue/message'
import Textarea from 'primevue/textarea'
import CampoFormulario from '@/shared/components/CampoFormulario.vue'
import DialogoAccion from '@/shared/components/DialogoAccion.vue'
import { useAccion } from '@/shared/composables/useAccion'
import { reemplazar } from '../api/catalogos.api'
import type { ClaveCatalogo } from '../types/catalogo.types'
import { validarContenido } from '../utils/validarCatalogo'

const MAX_CARACTERES = 200_000

const props = defineProps<{ clave: ClaveCatalogo; titulo: string; actual: unknown[] }>()
const emit = defineEmits<{ cerrar: []; actualizar: [] }>()

const { abierto, enviando, errores, mensaje, limpiar, ejecutar } = useAccion(() => emit('actualizar'))
const inicial = JSON.stringify(props.actual, null, 2)
const texto = ref(inicial)
const entiendo = ref(false)
watch(texto, () => limpiar('contenido'))
watch(entiendo, () => limpiar('confirmacion'))
const sinCambios = computed(() => texto.value.trim() === inicial.trim())

function analizar(): { contenido?: unknown[]; error?: string } {
  if (!texto.value.trim()) return { error: 'Escribe el contenido en formato JSON.' }
  if (texto.value.length > MAX_CARACTERES) return { error: 'El contenido es demasiado grande.' }
  let valor: unknown
  try {
    valor = JSON.parse(texto.value)
  } catch (e) {
    return { error: `JSON no válido: ${e instanceof Error ? e.message : 'revisa comas y llaves'}.` }
  }
  const problema = validarContenido(props.clave, valor)
  return problema ? { error: problema } : { contenido: valor as unknown[] }
}

function guardar() {
  const r = analizar()
  return ejecutar({
    campos: ['contenido'],
    validar: () => ({
      ...(r.error ? { contenido: r.error } : {}),
      ...(!r.error && !entiendo.value ? { confirmacion: 'Confirma que entiendes que se reemplaza todo el catálogo.' } : {}),
    }),
    enviar: () => reemplazar(props.clave, r.contenido!),
    exito: () => ({ titulo: 'Catálogo reemplazado', detalle: props.titulo }),
  })
}
</script>

<template>
  <DialogoAccion
    v-model:visible="abierto"
    :titulo="`Editor avanzado: ${titulo}`"
    etiqueta-guardar="Reemplazar todo"
    icono-guardar="pi pi-exclamation-triangle"
    severidad-guardar="danger"
    :sin-cambios="sinCambios"
    :enviando="enviando"
    :mensaje="mensaje"
    ancho="50rem"
    @guardar="guardar"
    @cerrado="emit('cerrar')"
  >
    <Message severity="warn" :closable="false">
      Esto reemplaza <strong>todo</strong> el contenido del catálogo. Lo que no incluyas se perderá. Para cambios puntuales usa los botones de agregar y editar.
    </Message>
    <CampoFormulario id="rem-json" etiqueta="Contenido (JSON)" requerido :error="errores.contenido">
      <Textarea id="rem-json" v-model="texto" rows="16" spellcheck="false" class="json" :invalid="!!errores.contenido" :disabled="enviando" fluid />
    </CampoFormulario>
    <CampoFormulario id="rem-ok" etiqueta="" :error="errores.confirmacion">
      <label class="ok">
        <Checkbox v-model="entiendo" binary input-id="rem-ok" :disabled="enviando" />
        Entiendo que se reemplaza todo el catálogo
      </label>
    </CampoFormulario>
  </DialogoAccion>
</template>

<style scoped>
.json {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.8rem;
  white-space: pre;
  overflow: auto;
}
.ok {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
</style>
