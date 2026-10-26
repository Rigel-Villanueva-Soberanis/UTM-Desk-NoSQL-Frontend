<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import { primerError } from '@/core/http/errores'
import { LIMITES } from '@/core/utils/validacion'
import CampoFormulario from '@/shared/components/CampoFormulario.vue'
import DialogoAccion from '@/shared/components/DialogoAccion.vue'
import { eliminar } from '../../api/gestion.api'
import type { Incidencia } from '../../types/incidencia.types'
import { useAccion } from '@/shared/composables/useAccion'

const props = defineProps<{ incidencia: Incidencia }>()
/** `eliminado`: ya no existe → la pantalla vuelve al listado (no hay nada que recargar). */
const emit = defineEmits<{ cerrar: []; actualizar: []; eliminado: [] }>()

const { abierto, enviando, errores, mensaje, limpiar, ejecutar } = useAccion(
  () => emit('actualizar'),
  () => emit('eliminado'),
)

const escrito = ref('')
watch(escrito, () => limpiar('folio'))

const normalizar = (t: string) => t.trim().toUpperCase()
const coincide = computed(() => normalizar(escrito.value) === normalizar(props.incidencia.folio))
const archivos = computed(() => props.incidencia.evidenciasAdjuntas.length)

function guardar() {
  return ejecutar({
    campos: ['folio'],
    validar: () => (coincide.value ? {} : { folio: 'Escribe el folio exactamente como aparece arriba para confirmar.' }),
    enviar: () => eliminar(props.incidencia.id),
    exito: (r) => ({
      titulo: 'Incidencia eliminada',
      detalle: `${r?.folio ?? props.incidencia.folio} · ${r?.archivosEliminados ?? archivos.value} archivo(s) eliminado(s).`,
    }),
  })
}
</script>

<template>
  <DialogoAccion
    v-model:visible="abierto"
    titulo="Eliminar incidencia"
    :contexto="incidencia.titulo"
    etiqueta-guardar="Eliminar definitivamente"
    icono-guardar="pi pi-trash"
    severidad-guardar="danger"
    :enviando="enviando"
    :sin-cambios="!coincide"
    :mensaje="mensaje"
    @guardar="guardar"
    @cerrado="emit('cerrar')"
  >
    <Message severity="warn" :closable="false">
      Se borrará la incidencia
      <strong class="folio">{{ incidencia.folio }}</strong>
      <template v-if="archivos"> y sus {{ archivos }} evidencia{{ archivos === 1 ? '' : 's' }} de la nube</template>.
      <strong>Esta acción no se puede deshacer.</strong>
    </Message>

    <CampoFormulario
      id="confirmar-folio"
      :etiqueta="`Para confirmar, escribe ${incidencia.folio}`"
      :error="primerError(errores, 'folio')"
    >
      <InputText
        id="confirmar-folio"
        v-model="escrito"
        :maxlength="LIMITES.folio.max"
        :placeholder="incidencia.folio"
        autocomplete="off"
        spellcheck="false"
        :invalid="!!errores.folio"
        :disabled="enviando"
        autofocus
        fluid
      />
    </CampoFormulario>
  </DialogoAccion>
</template>

<style scoped>
.folio {
  overflow-wrap: anywhere;
}
</style>
