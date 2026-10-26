<script setup lang="ts">
import { reactive, watch } from 'vue'
import Textarea from 'primevue/textarea'
import { primerError } from '@/core/http/errores'
import { LIMITES, mensajeLongitud, sinControl } from '@/core/utils/validacion'
import CampoFormulario from '@/shared/components/CampoFormulario.vue'
import DialogoAccion from '@/shared/components/DialogoAccion.vue'
import { agregarNota } from '../../api/gestion.api'
import type { Incidencia } from '../../types/incidencia.types'
import { useAccion } from '@/shared/composables/useAccion'

const props = defineProps<{ incidencia: Incidencia }>()
const emit = defineEmits<{ cerrar: []; actualizar: [] }>()

const { abierto, enviando, errores, mensaje, limpiar, ejecutar } = useAccion(() => emit('actualizar'))
const form = reactive({ nota: '' })
watch(() => form.nota, () => limpiar('nota'))

function guardar() {
  const nota = sinControl(form.nota).trim()
  return ejecutar({
    campos: ['nota'],
    validar: () =>
      nota.length < LIMITES.nota.min || nota.length > LIMITES.nota.max
        ? { nota: mensajeLongitud('La nota', LIMITES.nota.min, LIMITES.nota.max) }
        : {},
    enviar: () => agregarNota(props.incidencia.id, nota),
    exito: () => ({ titulo: 'Nota agregada', detalle: `Quedó registrada en la bitácora de ${props.incidencia.folio}.` }),
  })
}
</script>

<template>
  <DialogoAccion
    v-model:visible="abierto"
    titulo="Agregar nota"
    :contexto="`${incidencia.folio} · ${incidencia.titulo}`"
    icono-guardar="pi pi-comment"
    etiqueta-guardar="Agregar nota"
    :enviando="enviando"
    :mensaje="mensaje"
    @guardar="guardar"
    @cerrado="emit('cerrar')"
  >
    <CampoFormulario
      id="nota"
      etiqueta="Nota de seguimiento"
      requerido
      :error="primerError(errores, 'nota')"
      :contador="{ actual: form.nota.length, max: LIMITES.nota.max }"
    >
      <Textarea
        id="nota"
        v-model="form.nota"
        rows="5"
        :maxlength="LIMITES.nota.max"
        auto-resize
        placeholder="Ej. Se revisó el rack B: el puerto 12 no da enlace. Se pidió refacción."
        :invalid="!!errores.nota"
        :disabled="enviando"
        autofocus
        fluid
      />
    </CampoFormulario>
  </DialogoAccion>
</template>
