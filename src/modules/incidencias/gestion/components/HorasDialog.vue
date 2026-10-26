<script setup lang="ts">
import { reactive, watch } from 'vue'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import { primerError } from '@/core/http/errores'
import { LIMITES, sinControl } from '@/core/utils/validacion'
import CampoFormulario from '@/shared/components/CampoFormulario.vue'
import DialogoAccion from '@/shared/components/DialogoAccion.vue'
import { registrarHoras } from '../../api/gestion.api'
import type { Incidencia } from '../../types/incidencia.types'
import { useAccion } from '@/shared/composables/useAccion'

const props = defineProps<{ incidencia: Incidencia }>()
const emit = defineEmits<{ cerrar: []; actualizar: [] }>()

const { abierto, enviando, errores, mensaje, limpiar, ejecutar } = useAccion(() => emit('actualizar'))
const form = reactive({ horas: null as number | null, comentario: '' })
watch(() => form.horas, () => limpiar('horas'))
watch(() => form.comentario, () => limpiar('comentario'))

const h = (n: number) => `${Number(n.toFixed(2))} h`

function guardar() {
  const comentario = sinControl(form.comentario).trim()
  return ejecutar({
    campos: ['horas', 'comentario'],
    validar: () => {
      const e: Record<string, string> = {}
      const v = form.horas
      if (v === null || Number.isNaN(v)) e.horas = 'Indica cuántas horas trabajaste.'
      else if (v < LIMITES.horas.min || v > LIMITES.horas.max)
        e.horas = `Las horas deben estar entre ${LIMITES.horas.min} y ${LIMITES.horas.max}.`
      if (comentario.length > LIMITES.comentarioHoras.max)
        e.comentario = `El comentario no puede tener más de ${LIMITES.comentarioHoras.max} caracteres.`
      return e
    },
    enviar: () => registrarHoras(props.incidencia.id, form.horas as number, comentario || undefined),
    exito: (r) => ({
      titulo: 'Horas registradas',
      detalle: r
        ? `Se sumaron ${h(r.horasRegistradas ?? form.horas ?? 0)}. Total acumulado: ${h(r.horasTotales ?? 0)}.`
        : undefined,
    }),
  })
}
</script>

<template>
  <DialogoAccion
    v-model:visible="abierto"
    titulo="Registrar horas"
    :contexto="`${incidencia.folio} · ${incidencia.titulo}`"
    icono-guardar="pi pi-clock"
    etiqueta-guardar="Registrar"
    :enviando="enviando"
    :mensaje="mensaje"
    @guardar="guardar"
    @cerrado="emit('cerrar')"
  >
    <p class="total">Horas acumuladas: <strong>{{ h(incidencia.horasInvertidas) }}</strong></p>

    <CampoFormulario
      id="horas"
      etiqueta="Horas trabajadas"
      requerido
      :error="primerError(errores, 'horas')"
      :ayuda="`De ${LIMITES.horas.min} a ${LIMITES.horas.max} horas. Se suman a las ya registradas.`"
    >
      <InputNumber
        v-model="form.horas"
        input-id="horas"
        :min="0"
        :max="LIMITES.horas.max"
        :step="0.25"
        :min-fraction-digits="0"
        :max-fraction-digits="2"
        :use-grouping="false"
        show-buttons
        suffix=" h"
        placeholder="Ej. 1.5"
        :invalid="!!errores.horas"
        :disabled="enviando"
        autofocus
        fluid
      />
    </CampoFormulario>

    <CampoFormulario
      id="comentario"
      etiqueta="Comentario"
      opcional
      :error="primerError(errores, 'comentario')"
      :contador="{ actual: form.comentario.length, max: LIMITES.comentarioHoras.max }"
    >
      <Textarea
        id="comentario"
        v-model="form.comentario"
        rows="3"
        :maxlength="LIMITES.comentarioHoras.max"
        auto-resize
        placeholder="Ej. Cableado del rack B."
        :invalid="!!errores.comentario"
        :disabled="enviando"
        fluid
      />
    </CampoFormulario>
  </DialogoAccion>
</template>

<style scoped>
.total {
  color: var(--on-surface-variant);
}
.total strong {
  color: var(--on-surface);
}
</style>
