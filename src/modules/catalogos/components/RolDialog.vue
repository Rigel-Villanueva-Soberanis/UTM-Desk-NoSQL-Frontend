<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AutoComplete from 'primevue/autocomplete'
import { normalizarTexto } from '@/core/utils/texto'
import { LIMITES, limpiarEspacios, sinControl } from '@/core/utils/validacion'
import CampoFormulario from '@/shared/components/CampoFormulario.vue'
import DialogoAccion from '@/shared/components/DialogoAccion.vue'
import { useAccion } from '@/shared/composables/useAccion'
import { editarElemento } from '../api/catalogos.api'
import type { RolCatalogo } from '../types/catalogo.types'
import { validarClasificaciones } from '../utils/validarCatalogo'

const props = defineProps<{ elemento: RolCatalogo }>()
const emit = defineEmits<{ cerrar: []; actualizar: [] }>()

const { abierto, enviando, errores, mensaje, limpiar, ejecutar } = useAccion(() => emit('actualizar'))
const lista = ref<string[]>([...props.elemento.clasificaciones_permitidas])
watch(lista, () => limpiar('clasificaciones_permitidas'), { deep: true })
const limpio = (t: string) => limpiarEspacios(sinControl(t))

/** Al teclear Enter o coma se agrega la clasificación (sin sugerencias). */
function alCambiar(v: unknown) {
  lista.value = (Array.isArray(v) ? v : []).map((x) => limpio(String(x))).filter((x, i, a) => !!x && a.findIndex((y) => normalizarTexto(y) === normalizarTexto(x)) === i)
}

const sinCambios = computed(
  () => JSON.stringify(lista.value) === JSON.stringify(props.elemento.clasificaciones_permitidas),
)

function guardar() {
  return ejecutar({
    campos: ['clasificaciones_permitidas'],
    validar: () => ({ clasificaciones_permitidas: validarClasificaciones(lista.value, props.elemento.requiere_clasificacion) }),
    enviar: () => editarElemento('roles_sistema', props.elemento.rol, { clasificaciones_permitidas: lista.value.map(limpio) }),
    exito: () => ({ titulo: 'Clasificaciones actualizadas', detalle: props.elemento.rol }),
  })
}
</script>

<template>
  <DialogoAccion
    v-model:visible="abierto"
    :titulo="`Clasificaciones de «${elemento.rol}»`"
    :contexto="elemento.requiere_clasificacion ? 'Este rol requiere una clasificación al crear usuarios.' : 'Este rol no requiere clasificación.'"
    :sin-cambios="sinCambios"
    :enviando="enviando"
    :mensaje="mensaje"
    @guardar="guardar"
    @cerrado="emit('cerrar')"
  >
    <CampoFormulario
      id="rol-clasificaciones"
      etiqueta="Clasificaciones permitidas"
      :requerido="elemento.requiere_clasificacion"
      :opcional="!elemento.requiere_clasificacion"
      :error="errores.clasificaciones_permitidas"
      ayuda="Escribe una y presiona Enter para agregarla."
    >
      <AutoComplete
        :model-value="lista"
        input-id="rol-clasificaciones"
        multiple
        fluid
        :typeahead="false"
        :max-length="LIMITES.textoCatalogo.max"
        add-on-blur
        separator=","
        :invalid="!!errores.clasificaciones_permitidas"
        :disabled="enviando"
        @update:model-value="alCambiar"
      />
    </CampoFormulario>
  </DialogoAccion>
</template>
