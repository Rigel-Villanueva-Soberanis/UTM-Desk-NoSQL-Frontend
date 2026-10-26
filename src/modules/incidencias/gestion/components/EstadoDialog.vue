<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
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

const form = reactive({ estado: '' as Estado | '', motivo: '' })

/** Técnico: solo `flujoTecnico` (abierta → en proceso, en proceso → resuelta). Root / Soporte / Administrativos: cualquiera (incluye reabrir). */
const opciones = computed(() => {
  const permitidos =
    sesion.rol === 'tecnico'
      ? (flujoTecnico[props.incidencia.estado] ?? [])
      : ESTADOS.map((e) => e.valor).filter((v) => v !== props.incidencia.estado)
  return ESTADOS.filter((e) => permitidos.includes(e.valor))
})

const sinOpciones = computed(() => !opciones.value.length)
const cierraAhora = computed(() => ['resuelta', 'cancelada'].includes(props.incidencia.estado))

const ayudaEstado = computed(() => {
  if (form.estado === 'resuelta') return 'Al resolverla se programa su borrado automático a los 60 días.'
  if (cierraAhora.value && form.estado) return 'Al reabrirla se cancela el borrado automático.'
  return ''
})

// «Marcar resuelta» abre el diálogo con el estado ya elegido (solo si ese cambio está permitido).
if (props.estadoInicial && opciones.value.some((o) => o.valor === props.estadoInicial)) form.estado = props.estadoInicial

watch(() => form.estado, () => limpiar('estado'))
watch(() => form.motivo, () => limpiar('motivo'))

function guardar() {
  const motivo = sinControl(form.motivo).trim()
  return ejecutar({
    campos: ['estado', 'motivo'],
    validar: () => {
      const e: Record<string, string> = {}
      if (!form.estado) e.estado = 'Elige el nuevo estado.'
      else if (!opciones.value.some((o) => o.valor === form.estado)) e.estado = 'Ese cambio de estado no está permitido.'
      if (motivo.length < LIMITES.motivo.min || motivo.length > LIMITES.motivo.max)
        e.motivo = mensajeLongitud('El motivo', LIMITES.motivo.min, LIMITES.motivo.max)
      return e
    },
    enviar: () => cambiarEstado(props.incidencia.id, form.estado as Estado, motivo),
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
    :titulo="estadoInicial === 'resuelta' ? 'Marcar como resuelta' : 'Cambiar estado'"
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
    </template>
  </DialogoAccion>
</template>

<style scoped>
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
