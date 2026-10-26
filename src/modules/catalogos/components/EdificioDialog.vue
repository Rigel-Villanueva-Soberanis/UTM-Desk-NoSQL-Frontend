<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import { primerError } from '@/core/http/errores'
import { LIMITES, limpiarEspacios, normalizarClave, sinControl } from '@/core/utils/validacion'
import CampoFormulario from '@/shared/components/CampoFormulario.vue'
import DialogoAccion from '@/shared/components/DialogoAccion.vue'
import { useAccion } from '@/shared/composables/useAccion'
import { agregarElemento, editarElemento } from '../api/catalogos.api'
import type { Edificio } from '../types/catalogo.types'
import { validarEdificio } from '../utils/validarCatalogo'

/**
 * Nuevo edificio (con sus salones, opcional) o cambio de su nombre.
 * Los salones de un edificio que ya existe se agregan y renombran en «Salones» (SalonesDialog).
 */
const props = defineProps<{ elemento?: Edificio; existentes: string[] }>()
const emit = defineEmits<{ cerrar: []; actualizar: [] }>()
const esNuevo = computed(() => !props.elemento)

const { abierto, enviando, errores, mensaje, limpiar, ejecutar } = useAccion(() => emit('actualizar'))
const form = reactive({
  clave: props.elemento?.clave ?? '',
  edificio: props.elemento?.edificio ?? '',
  salones: '',
})
const claveManual = ref(false)
const limpio = (t: string) => limpiarEspacios(sinControl(t))
/** Un salón por línea; se ignoran las líneas vacías. */
const listaSalones = () => form.salones.split('\n').map(limpio).filter(Boolean)

// La clave se sugiere a partir del nombre mientras no se escriba a mano ("Edificio D" → "edificio_d").
watch(
  () => form.edificio,
  () => {
    limpiar('edificio')
    if (esNuevo.value && !claveManual.value) form.clave = normalizarClave(form.edificio).slice(0, LIMITES.claveCatalogo.max)
  },
)
watch(() => form.clave, () => limpiar('clave'))
watch(() => form.salones, () => limpiar('salones'))

const sinCambios = computed(() => !esNuevo.value && limpio(form.edificio) === props.elemento!.edificio)

function guardar() {
  const edificio = limpio(form.edificio)
  const clave = form.clave.trim()
  const salones = listaSalones()
  return ejecutar({
    campos: ['clave', 'edificio', 'salones'],
    validar: () => validarEdificio({ clave, edificio, salones }, props.existentes, esNuevo.value),
    enviar: () =>
      esNuevo.value
        ? agregarElemento('edificios', { clave, edificio, ...(salones.length ? { salones } : {}) })
        : editarElemento('edificios', props.elemento!.clave, { edificio }),
    exito: () =>
      esNuevo.value
        ? { titulo: 'Edificio agregado', detalle: `${edificio} ya aparece al reportar fallas.` }
        : { titulo: 'Edificio actualizado', detalle: edificio },
  })
}
</script>

<template>
  <DialogoAccion
    v-model:visible="abierto"
    :titulo="esNuevo ? 'Agregar edificio' : 'Editar edificio'"
    :contexto="esNuevo ? '' : `Clave: ${elemento!.clave}`"
    :etiqueta-guardar="esNuevo ? 'Agregar' : 'Guardar'"
    :sin-cambios="sinCambios"
    :enviando="enviando"
    :mensaje="mensaje"
    @guardar="guardar"
    @cerrado="emit('cerrar')"
  >
    <CampoFormulario id="ed-edificio" etiqueta="Edificio" requerido :error="primerError(errores, 'edificio')" :contador="{ actual: form.edificio.length, max: LIMITES.textoCatalogo.max }">
      <InputText id="ed-edificio" v-model="form.edificio" :maxlength="LIMITES.textoCatalogo.max" placeholder="Ej. Edificio D" :invalid="!!errores.edificio" :disabled="enviando" fluid />
    </CampoFormulario>
    <template v-if="esNuevo">
      <CampoFormulario
        id="ed-clave"
        etiqueta="Clave"
        requerido
        :error="primerError(errores, 'clave')"
        ayuda="Identificador único: minúsculas, números y guion bajo. No se puede cambiar después."
      >
        <InputText id="ed-clave" v-model="form.clave" :maxlength="LIMITES.claveCatalogo.max" placeholder="edificio_d" autocapitalize="off" :invalid="!!errores.clave" :disabled="enviando" fluid @input="claveManual = true" />
      </CampoFormulario>
      <CampoFormulario id="ed-salones" etiqueta="Salones" opcional :error="primerError(errores, 'salones')" ayuda="Uno por línea. También se pueden agregar después.">
        <Textarea id="ed-salones" v-model="form.salones" rows="5" placeholder="Aula 1&#10;Aula 2" :invalid="!!errores.salones" :disabled="enviando" fluid />
      </CampoFormulario>
    </template>
    <p v-else class="nota">Los salones de este edificio se agregan y renombran desde el botón «Salones» de la tabla.</p>
  </DialogoAccion>
</template>

<style scoped>
.nota {
  margin: 0;
  color: var(--on-surface-variant);
  font-size: 0.85rem;
}
</style>
