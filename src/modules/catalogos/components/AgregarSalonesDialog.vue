<script setup lang="ts">
import { computed, ref } from 'vue'
import { primerError } from '@/core/http/errores'
import { useAccion } from '@/shared/composables/useAccion'
import { agregarSalones } from '../api/catalogos.api'
import type { Edificio } from '../types/catalogo.types'
import { validarSalones } from '../utils/validarCatalogo'
import EditorSalones from './EditorSalones.vue'
import ModalCatalogo from './ModalCatalogo.vue'

/** Suma salones a un edificio que ya existe (el «+» de su fila). Para renombrar uno, se usa «Editar edificio». */
const props = defineProps<{ elemento: Edificio }>()
const emit = defineEmits<{ cerrar: []; actualizar: [] }>()

const { abierto, enviando, errores, mensaje, limpiar, ejecutar } = useAccion(() => emit('actualizar'))
const nuevos = ref<string[]>([])
const n = computed(() => nuevos.value.length)

function guardar() {
  return ejecutar({
    campos: ['salones'],
    validar: () => {
      if (!nuevos.value.length) return { salones: 'Agrega al menos un salón.' }
      return { salones: validarSalones(nuevos.value, props.elemento.salones) }
    },
    enviar: () => agregarSalones(props.elemento.clave, nuevos.value),
    exito: () => ({
      titulo: n.value === 1 ? 'Salón agregado' : 'Salones agregados',
      detalle: props.elemento.edificio,
    }),
  })
}
</script>

<template>
  <ModalCatalogo
    v-model:visible="abierto"
    titulo="Agregar salones"
    :descripcion="`${elemento.edificio} · ${elemento.salones.length} ${elemento.salones.length === 1 ? 'salón registrado' : 'salones registrados'}`"
    icono="pi pi-plus"
    :etiqueta-guardar="n > 1 ? `Agregar ${n} salones` : 'Agregar salón'"
    icono-guardar="pi pi-check"
    :sin-cambios="!n"
    :enviando="enviando"
    :mensaje="mensaje"
    :estado="n ? `${n} por agregar` : 'Aún no hay salones por agregar'"
    :estado-ok="!!n"
    @guardar="guardar"
    @cerrado="emit('cerrar')"
  >
    <EditorSalones v-model="nuevos" :ya="elemento.salones" :error="primerError(errores, 'salones')" :disabled="enviando" :opcional="false" etiqueta="Nuevos salones" @cambio="limpiar('salones')" />
  </ModalCatalogo>
</template>
