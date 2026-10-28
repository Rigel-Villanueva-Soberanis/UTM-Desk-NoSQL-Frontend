<script setup lang="ts">
import { reactive, watch } from 'vue'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import { primerError } from '@/core/http/errores'
import { textoTiempo } from '@/core/types/tiempo'
import { LIMITES, sinControl } from '@/core/utils/validacion'
import CampoFormulario from '@/shared/components/CampoFormulario.vue'
import DialogoAccion from '@/shared/components/DialogoAccion.vue'
import { registrarHoras } from '../../api/gestion.api'
import type { Incidencia } from '../../types/incidencia.types'
import { useAccion } from '@/shared/composables/useAccion'

const props = defineProps<{ incidencia: Incidencia }>()
const emit = defineEmits<{ cerrar: []; actualizar: [] }>()

const { abierto, enviando, errores, mensaje, limpiar, ejecutar } = useAccion(() => emit('actualizar'))
const form = reactive({ horas: 0 as number | null, minutos: 0 as number | null, comentario: '' })
watch(() => [form.horas, form.minutos], () => limpiar('horas', 'minutos'))
watch(() => form.comentario, () => limpiar('comentario'))

function guardar() {
  const comentario = sinControl(form.comentario).trim()
  const horas = form.horas ?? 0
  const minutos = form.minutos ?? 0
  return ejecutar({
    campos: ['horas', 'minutos', 'comentario'],
    validar: () => {
      const e: Record<string, string> = {}
      const { maxHoras, maxMinutos } = LIMITES.tiempo
      if (!Number.isInteger(horas) || horas < 0 || horas > maxHoras) e.horas = `Las horas deben ser un número entero de 0 a ${maxHoras}.`
      else if (!Number.isInteger(minutos) || minutos < 0 || minutos > maxMinutos) e.minutos = `Los minutos deben ser un número entero de 0 a ${maxMinutos}.`
      else if (horas === 0 && minutos === 0) e.horas = 'Indica al menos 1 minuto de trabajo.'
      else if (horas === maxHoras && minutos > 0) e.minutos = `Cada registro puede ser de máximo ${maxHoras} horas.`
      if (comentario.length > LIMITES.comentarioHoras.max)
        e.comentario = `El comentario no puede tener más de ${LIMITES.comentarioHoras.max} caracteres.`
      return e
    },
    enviar: () => registrarHoras(props.incidencia.id, horas, minutos, comentario || undefined),
    exito: (r) => ({
      titulo: 'Tiempo registrado',
      detalle: r
        ? `Se sumaron ${r.tiempoRegistrado?.texto ?? textoTiempo(horas, minutos)}. Total acumulado: ${r.tiempoTotal?.texto ?? '—'}.`
        : undefined,
    }),
  })
}
</script>

<template>
  <DialogoAccion
    v-model:visible="abierto"
    titulo="Registrar tiempo"
    :contexto="`${incidencia.folio} · ${incidencia.titulo}`"
    icono-guardar="pi pi-clock"
    etiqueta-guardar="Registrar"
    :enviando="enviando"
    :mensaje="mensaje"
    @guardar="guardar"
    @cerrado="emit('cerrar')"
  >
    <p class="total">Tiempo acumulado: <strong>{{ incidencia.tiempoInvertido.texto }}</strong></p>

    <CampoFormulario
      id="horas"
      etiqueta="Tiempo trabajado"
      requerido
      :error="primerError(errores, 'horas') || primerError(errores, 'minutos')"
      ayuda="Mínimo 1 minuto y máximo 24 horas por registro. Se suma al tiempo ya registrado."
    >
      <div class="par">
        <InputNumber
          v-model="form.horas"
          input-id="horas"
          :min="0"
          :max="LIMITES.tiempo.maxHoras"
          :use-grouping="false"
          :max-fraction-digits="0"
          show-buttons
          suffix=" h"
          aria-label="Horas"
          :invalid="!!errores.horas"
          :disabled="enviando"
          autofocus
          fluid
        />
        <InputNumber
          v-model="form.minutos"
          input-id="minutos"
          :min="0"
          :max="LIMITES.tiempo.maxMinutos"
          :use-grouping="false"
          :max-fraction-digits="0"
          show-buttons
          suffix=" min"
          aria-label="Minutos"
          :invalid="!!errores.minutos"
          :disabled="enviando"
          fluid
        />
      </div>
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
.par {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.total {
  color: var(--on-surface-variant);
}
.total strong {
  color: var(--on-surface);
}
</style>
