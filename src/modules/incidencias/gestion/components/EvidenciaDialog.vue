<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useSesionStore } from '@/core/auth/sesion.store'
import { primerError } from '@/core/http/errores'
import { MAX_ARCHIVOS, validarArchivo } from '@/core/utils/archivos'
import DialogoAccion from '@/shared/components/DialogoAccion.vue'
import SubirArchivos from '@/shared/components/SubirArchivos.vue'
import { ligar, subir } from '../../api/evidencias.api'
import type { EvidenciaSubida, Incidencia } from '../../types/incidencia.types'
import { useAccion } from '@/shared/composables/useAccion'

const props = defineProps<{ incidencia: Incidencia }>()
const emit = defineEmits<{ cerrar: []; actualizar: [] }>()

const sesion = useSesionStore()
const { abierto, enviando, errores, mensaje, limpiar, ejecutar } = useAccion(() => emit('actualizar'))

const archivos = ref<File[]>([])
const etapa = ref<'subiendo' | 'ligando' | null>(null)
/** Lo ya subido se conserva: si falla el "ligar" y se reintenta, no se vuelve a subir. */
let subidas: EvidenciaSubida[] | null = null

watch(archivos, () => {
  subidas = null // si cambian los archivos, lo ya subido ya no corresponde
  limpiar('archivos', 'evidencias')
})

/**
 * Límite por incidencia: Reportante y Técnico, 3 evidencias propias; Root, sin límite
 * (pero máximo 3 archivos por envío). Superarlo da 409 en el backend.
 */
const propias = computed(
  () => props.incidencia.evidenciasAdjuntas.filter((e) => e.subidoPor?.idUsuario === sesion.usuario?.id).length,
)
const conLimite = computed(() => sesion.rol !== 'root')
const disponibles = computed(() => (conLimite.value ? Math.max(0, MAX_ARCHIVOS - propias.value) : MAX_ARCHIVOS))
const lleno = computed(() => disponibles.value === 0)

const error = computed(() => primerError(errores.value, 'archivos', 'evidencias'))
const textoBoton = computed(() => (etapa.value === 'subiendo' ? 'Subiendo…' : etapa.value === 'ligando' ? 'Adjuntando…' : 'Subir'))

function guardar() {
  return ejecutar({
    campos: ['archivos', 'evidencias'],
    validar: () => {
      if (!archivos.value.length) return { archivos: 'Elige al menos un archivo.' }
      if (archivos.value.length > disponibles.value)
        return { archivos: `Solo puedes subir ${disponibles.value} archivo(s) más.` }
      const motivos = archivos.value.map((a) => validarArchivo(a)).filter(Boolean)
      return motivos.length ? { archivos: motivos.join(' ') } : {}
    },
    enviar: async () => {
      try {
        if (!subidas) {
          etapa.value = 'subiendo'
          subidas = await subir(archivos.value)
        }
        etapa.value = 'ligando'
        return await ligar(
          props.incidencia.id,
          subidas.map(({ publicId, formato, nombreArchivo }) => ({ publicId, formato, nombreArchivo })),
        )
      } finally {
        etapa.value = null
      }
    },
    exito: () => ({
      titulo: 'Evidencias agregadas',
      detalle: `${archivos.value.length === 1 ? 'Se adjuntó 1 archivo' : `Se adjuntaron ${archivos.value.length} archivos`} a ${props.incidencia.folio}.`,
    }),
  })
}
</script>

<template>
  <DialogoAccion
    v-model:visible="abierto"
    titulo="Agregar evidencia"
    :contexto="`${incidencia.folio} · ${incidencia.titulo}`"
    icono-guardar="pi pi-upload"
    :etiqueta-guardar="textoBoton"
    :enviando="enviando"
    :sin-cambios="lleno"
    :mensaje="mensaje"
    ancho="38rem"
    @guardar="guardar"
    @cerrado="emit('cerrar')"
  >
    <p v-if="lleno" class="aviso">
      Ya adjuntaste el máximo de {{ MAX_ARCHIVOS }} evidencias en esta incidencia.
    </p>
    <p v-else-if="conLimite" class="ayuda">
      Puedes subir {{ disponibles }} archivo{{ disponibles === 1 ? '' : 's' }} más
      ({{ propias }} de {{ MAX_ARCHIVOS }} usados).
    </p>

    <SubirArchivos v-model="archivos" :max="Math.max(disponibles, 1)" :disabled="enviando || lleno" :error="error" />
  </DialogoAccion>
</template>

<style scoped>
.aviso {
  padding: 12px;
  border-radius: 8px;
  background: var(--surface-low);
  color: var(--on-surface-variant);
}
.ayuda {
  color: var(--on-surface-variant);
}
</style>
