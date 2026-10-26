<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import InputText from 'primevue/inputtext'
import { primerError } from '@/core/http/errores'
import { LIMITES, limpiarEspacios, mensajeLongitud, sinControl } from '@/core/utils/validacion'
import CampoFormulario from '@/shared/components/CampoFormulario.vue'
import DialogoAccion from '@/shared/components/DialogoAccion.vue'
import { asignarExterno } from '../../api/gestion.api'
import type { Incidencia } from '../../types/incidencia.types'
import { useAccion } from '@/shared/composables/useAccion'

const props = defineProps<{ incidencia: Incidencia }>()
const emit = defineEmits<{ cerrar: []; actualizar: [] }>()

const { abierto, enviando, errores, mensaje, limpiar, ejecutar } = useAccion(() => emit('actualizar'))

const previo = computed(() => (props.incidencia.tecnicoExterno?.requiereServicioExterno ? props.incidencia.tecnicoExterno : null))
const form = reactive({
  empresa: previo.value?.empresaProveedor ?? '',
  tecnicoResponsable: previo.value?.nombreTecnico ?? '',
  contacto: previo.value?.contacto ?? '',
  ordenServicio: previo.value?.ordenServicioRef ?? '',
})
for (const k of ['empresa', 'tecnicoResponsable', 'contacto', 'ordenServicio'] as const) watch(() => form[k], () => limpiar(k))

const limpio = (t: string) => limpiarEspacios(sinControl(t))

function guardar() {
  const d = {
    empresa: limpio(form.empresa),
    tecnicoResponsable: limpio(form.tecnicoResponsable),
    contacto: limpio(form.contacto),
    ordenServicio: limpio(form.ordenServicio),
  }
  return ejecutar({
    campos: ['empresa', 'tecnicoResponsable', 'contacto', 'ordenServicio'],
    validar: () => {
      const e: Record<string, string> = {}
      if (!d.empresa) e.empresa = 'La empresa es obligatoria.'
      else if (d.empresa.length > LIMITES.empresa.max) e.empresa = mensajeLongitud('La empresa', 0, LIMITES.empresa.max)
      if (!d.ordenServicio) e.ordenServicio = 'La orden de servicio es obligatoria.'
      else if (d.ordenServicio.length > LIMITES.ordenServicio.max)
        e.ordenServicio = mensajeLongitud('La orden de servicio', 0, LIMITES.ordenServicio.max)
      if (d.tecnicoResponsable.length > LIMITES.tecnicoResponsable.max)
        e.tecnicoResponsable = mensajeLongitud('El técnico responsable', 0, LIMITES.tecnicoResponsable.max)
      if (d.contacto.length > LIMITES.contacto.max) e.contacto = mensajeLongitud('El contacto', 0, LIMITES.contacto.max)

      const p = previo.value
      if (
        !Object.keys(e).length &&
        p &&
        d.empresa === p.empresaProveedor &&
        d.ordenServicio === p.ordenServicioRef &&
        d.tecnicoResponsable === (p.nombreTecnico ?? '') &&
        d.contacto === (p.contacto ?? '')
      )
        e._general = 'Son los mismos datos que ya tiene registrados la incidencia.'
      return e
    },
    enviar: () =>
      asignarExterno(props.incidencia.id, {
        empresa: d.empresa,
        ordenServicio: d.ordenServicio,
        ...(d.tecnicoResponsable ? { tecnicoResponsable: d.tecnicoResponsable } : {}),
        ...(d.contacto ? { contacto: d.contacto } : {}),
      }),
    exito: () => ({
      titulo: previo.value ? 'Proveedor externo actualizado' : 'Proveedor externo registrado',
      detalle: `${d.empresa} · ${d.ordenServicio}`,
    }),
  })
}
</script>

<template>
  <DialogoAccion
    v-model:visible="abierto"
    titulo="Proveedor externo"
    :contexto="`${incidencia.folio} · ${incidencia.titulo}`"
    icono-guardar="pi pi-building"
    :enviando="enviando"
    :mensaje="mensaje"
    @guardar="guardar"
    @cerrado="emit('cerrar')"
  >
    <p v-if="previo" class="nota">Ya tiene un proveedor registrado: al guardar se reemplazarán sus datos.</p>

    <CampoFormulario
      id="empresa"
      etiqueta="Empresa"
      requerido
      :error="primerError(errores, 'empresa')"
      :contador="{ actual: form.empresa.length, max: LIMITES.empresa.max }"
    >
      <InputText id="empresa" v-model="form.empresa" :maxlength="LIMITES.empresa.max" placeholder="Ej. Telmex" :invalid="!!errores.empresa" :disabled="enviando" autofocus fluid />
    </CampoFormulario>

    <CampoFormulario
      id="tecnicoResponsable"
      etiqueta="Técnico responsable"
      opcional
      :error="primerError(errores, 'tecnicoResponsable')"
      :contador="{ actual: form.tecnicoResponsable.length, max: LIMITES.tecnicoResponsable.max }"
    >
      <InputText id="tecnicoResponsable" v-model="form.tecnicoResponsable" :maxlength="LIMITES.tecnicoResponsable.max" placeholder="Ej. Ing. Roberto Pech" :invalid="!!errores.tecnicoResponsable" :disabled="enviando" fluid />
    </CampoFormulario>

    <CampoFormulario
      id="contacto"
      etiqueta="Contacto"
      opcional
      :error="primerError(errores, 'contacto')"
      :contador="{ actual: form.contacto.length, max: LIMITES.contacto.max }"
    >
      <InputText id="contacto" v-model="form.contacto" :maxlength="LIMITES.contacto.max" placeholder="Teléfono o correo" :invalid="!!errores.contacto" :disabled="enviando" fluid />
    </CampoFormulario>

    <CampoFormulario
      id="ordenServicio"
      etiqueta="Orden de servicio"
      requerido
      :error="primerError(errores, 'ordenServicio')"
      :contador="{ actual: form.ordenServicio.length, max: LIMITES.ordenServicio.max }"
    >
      <InputText id="ordenServicio" v-model="form.ordenServicio" :maxlength="LIMITES.ordenServicio.max" placeholder="Ej. OS-8841" :invalid="!!errores.ordenServicio" :disabled="enviando" fluid />
    </CampoFormulario>
  </DialogoAccion>
</template>

<style scoped>
.nota {
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--surface-low);
  color: var(--on-surface-variant);
}
</style>
