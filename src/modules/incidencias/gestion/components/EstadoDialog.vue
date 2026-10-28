<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import { flujoTecnico } from '@/core/auth/reglas'
import { useSesionStore } from '@/core/auth/sesion.store'
import { primerError } from '@/core/http/errores'
import { LIMITES, mensajeLongitud, sinControl } from '@/core/utils/validacion'
import CampoFormulario from '@/shared/components/CampoFormulario.vue'
import DialogoAccion from '@/shared/components/DialogoAccion.vue'
import EstadoBadge from '@/shared/components/EstadoBadge.vue'
import { cambiarEstado } from '../../api/gestion.api'
import { ESTADOS, type Estado, type Incidencia } from '../../types/incidencia.types'
import { useAccion } from '@/shared/composables/useAccion'

const props = defineProps<{ incidencia: Incidencia; estadoInicial?: Estado }>()
const emit = defineEmits<{ cerrar: []; actualizar: [] }>()

const sesion = useSesionStore()
const { abierto, enviando, errores, mensaje, limpiar, ejecutar } = useAccion(() => emit('actualizar'))

const form = reactive({ estado: '' as Estado | '', motivo: '', horas: null as number | null, minutos: null as number | null })

/** Horas del trabajo: solo el técnico asignado o Root (Soporte / Administrativos reciben 403). */
const puedeHoras = computed(() => sesion.rol === 'tecnico' || sesion.rol === 'root')

/** Técnico: solo `flujoTecnico` (abierta → en proceso, en proceso → resuelta). Root / Soporte / Administrativos: cualquiera (incluye reabrir). */
const opciones = computed(() => {
  const permitidos =
    sesion.rol === 'tecnico'
      ? (flujoTecnico[props.incidencia.estado] ?? [])
      : ESTADOS.map((e) => e.valor).filter((v) => v !== props.incidencia.estado && (v !== 'cerrada' || props.incidencia.estado === 'resuelta'))
  return ESTADOS.filter((e) => permitidos.includes(e.valor))
})

const sinOpciones = computed(() => !opciones.value.length)
const cierraAhora = computed(() => ['resuelta', 'cerrada', 'cancelada'].includes(props.incidencia.estado))

const ayudaEstado = computed(() => {
  if (form.estado === 'cerrada') return 'Cierra la incidencia después de verificarla: ya no admitirá cambios.'
  if (form.estado === 'resuelta') return 'Al resolverla se programa su borrado automático a los 60 días.'
  if (cierraAhora.value && form.estado) return 'Al reabrirla se cancela el borrado automático.'
  return ''
})

// «Marcar resuelta» abre el diálogo con el estado ya elegido (solo si ese cambio está permitido).
if (props.estadoInicial && opciones.value.some((o) => o.valor === props.estadoInicial)) form.estado = props.estadoInicial

watch(() => form.estado, () => limpiar('estado'))
watch(() => form.motivo, () => limpiar('motivo'))
watch(() => [form.horas, form.minutos], () => limpiar('horas', 'minutos'))

function guardar() {
  const motivo = sinControl(form.motivo).trim()
  const horas = form.horas ?? 0
  const minutos = form.minutos ?? 0
  return ejecutar({
    campos: ['estado', 'motivo', 'horas', 'minutos'],
    validar: () => {
      const e: Record<string, string> = {}
      if (!form.estado) e.estado = 'Elige el nuevo estado.'
      else if (!opciones.value.some((o) => o.valor === form.estado)) e.estado = 'Ese cambio de estado no está permitido.'
      if (motivo.length < LIMITES.motivo.min || motivo.length > LIMITES.motivo.max)
        e.motivo = mensajeLongitud('El motivo', LIMITES.motivo.min, LIMITES.motivo.max)
      if (puedeHoras.value && (horas > 0 || minutos > 0)) {
        const { maxHoras, maxMinutos } = LIMITES.tiempo
        if (!Number.isInteger(horas) || horas < 0 || horas > maxHoras) e.horas = `Las horas deben ser un número entero de 0 a ${maxHoras}.`
        else if (!Number.isInteger(minutos) || minutos < 0 || minutos > maxMinutos) e.minutos = `Los minutos deben ser un número entero de 0 a ${maxMinutos}.`
        else if (horas === maxHoras && minutos > 0) e.minutos = `Cada registro puede ser de máximo ${maxHoras} horas.`
      }
      return e
    },
    enviar: () =>
      cambiarEstado(props.incidencia.id, form.estado as Estado, motivo, puedeHoras.value && (horas > 0 || minutos > 0) ? { horas, minutos } : undefined),
    exito: () => ({
      titulo: 'Estado actualizado',
      detalle: `${props.incidencia.folio} ahora está «${ESTADOS.find((e) => e.valor === form.estado)?.etiqueta ?? form.estado}».`,
    }),
  })
}
</script>

<template>
  <DialogoAccion
    v-model:visible="abierto"
    :titulo="estadoInicial === 'resuelta' ? 'Marcar como resuelta' : estadoInicial === 'cerrada' ? 'Cerrar incidencia' : 'Cambiar estado'"
    :contexto="`${incidencia.folio} · ${incidencia.titulo}`"
    icono-guardar="pi pi-sync"
    :enviando="enviando"
    :sin-cambios="sinOpciones"
    :mensaje="mensaje"
    @guardar="guardar"
    @cerrado="emit('cerrar')"
  >
    <p class="actual">Estado actual: <EstadoBadge :estado="incidencia.estado" /></p>

    <p v-if="sinOpciones" class="aviso">
      No hay cambios de estado disponibles para ti desde «{{ ESTADOS.find((e) => e.valor === incidencia.estado)?.etiqueta }}».
    </p>

    <template v-else>
      <CampoFormulario
        id="estado"
        etiqueta="Nuevo estado"
        requerido
        :error="primerError(errores, 'estado')"
        :ayuda="ayudaEstado"
      >
        <Select
          v-model="form.estado"
          input-id="estado"
          :options="opciones"
          option-label="etiqueta"
          option-value="valor"
          placeholder="Selecciona el nuevo estado"
          :invalid="!!errores.estado"
          :disabled="enviando"
          autofocus
          fluid
        />
      </CampoFormulario>

      <CampoFormulario
        id="motivo"
        etiqueta="Motivo"
        requerido
        :error="primerError(errores, 'motivo')"
        :contador="{ actual: form.motivo.length, max: LIMITES.motivo.max }"
      >
        <Textarea
          id="motivo"
          v-model="form.motivo"
          rows="4"
          :maxlength="LIMITES.motivo.max"
          auto-resize
          placeholder="Ej. Se reemplazó el switch dañado."
          :invalid="!!errores.motivo"
          :disabled="enviando"
          fluid
        />
      </CampoFormulario>

      <CampoFormulario
        v-if="puedeHoras"
        id="horas"
        etiqueta="Tiempo trabajado"
        opcional
        :error="primerError(errores, 'horas') || primerError(errores, 'minutos')"
        ayuda="Si lo llenas, se suma al tiempo registrado en este mismo cambio (máximo 24 h por registro)."
      >
        <div class="par">
          <InputNumber v-model="form.horas" input-id="horas" :min="0" :max="LIMITES.tiempo.maxHoras" :use-grouping="false" :max-fraction-digits="0" show-buttons suffix=" h" aria-label="Horas" :invalid="!!errores.horas" :disabled="enviando" fluid />
          <InputNumber v-model="form.minutos" input-id="minutos" :min="0" :max="LIMITES.tiempo.maxMinutos" :use-grouping="false" :max-fraction-digits="0" show-buttons suffix=" min" aria-label="Minutos" :invalid="!!errores.minutos" :disabled="enviando" fluid />
        </div>
      </CampoFormulario>
    </template>
  </DialogoAccion>
</template>

<style scoped>
.par {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.actual {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.aviso {
  padding: 12px;
  border-radius: 8px;
  background: var(--surface-low);
  color: var(--on-surface-variant);
}
</style>
