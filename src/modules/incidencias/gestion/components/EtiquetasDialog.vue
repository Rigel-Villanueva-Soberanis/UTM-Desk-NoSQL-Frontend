<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { primerError } from '@/core/http/errores'
import { LIMITES } from '@/core/utils/validacion'
import CampoFormulario from '@/shared/components/CampoFormulario.vue'
import DialogoAccion from '@/shared/components/DialogoAccion.vue'
import SelectorEtiquetas from '@/shared/components/SelectorEtiquetas.vue'
import { cambiarTags } from '../../api/gestion.api'
import type { Incidencia } from '../../types/incidencia.types'
import { useAccion } from '@/shared/composables/useAccion'

const props = defineProps<{ incidencia: Incidencia }>()
const emit = defineEmits<{ cerrar: []; actualizar: [] }>()

const { abierto, enviando, errores, mensaje, limpiar, ejecutar } = useAccion(() => emit('actualizar'))

const agregar = ref<string[]>([])
const quitar = ref<string[]>([])
watch(agregar, () => limpiar('agregar', 'quitar'))
watch(quitar, () => limpiar('agregar', 'quitar'))

const actuales = computed(() => props.incidencia.tags)

/** Cuántas etiquetas más caben: máx. 15 por incidencia (contando las que se van a quitar) y 10 por envío. */
const cupo = computed(() =>
  Math.max(0, Math.min(LIMITES.etiquetasPorLista, LIMITES.etiquetasPorIncidencia - actuales.value.length + quitar.value.length)),
)
const sinCambios = computed(() => !agregar.value.length && !quitar.value.length)

function alternar(tag: string) {
  quitar.value = quitar.value.includes(tag) ? quitar.value.filter((t) => t !== tag) : [...quitar.value, tag]
}

const resumen = computed(() => {
  const partes: string[] = []
  if (agregar.value.length) partes.push(`${agregar.value.length} agregada${agregar.value.length === 1 ? '' : 's'}`)
  if (quitar.value.length) partes.push(`${quitar.value.length} quitada${quitar.value.length === 1 ? '' : 's'}`)
  return partes.join(' y ')
})

function guardar() {
  return ejecutar({
    campos: ['agregar', 'quitar'],
    validar: () => {
      const e: Record<string, string> = {}
      const repetidas = agregar.value.filter((t) => actuales.value.includes(t) && !quitar.value.includes(t))
      const enAmbas = agregar.value.find((t) => quitar.value.includes(t))
      if (agregar.value.length > LIMITES.etiquetasPorLista) e.agregar = `Máximo ${LIMITES.etiquetasPorLista} etiquetas por envío.`
      else if (quitar.value.length > LIMITES.etiquetasPorLista) e.quitar = `Máximo ${LIMITES.etiquetasPorLista} etiquetas por envío.`
      else if (enAmbas) e.agregar = `«${enAmbas}» no puede agregarse y quitarse a la vez.`
      else if (repetidas.length) e.agregar = `La incidencia ya tiene la etiqueta «${repetidas[0]}».`
      else if (actuales.value.length - quitar.value.length + agregar.value.length > LIMITES.etiquetasPorIncidencia)
        e.agregar = `Una incidencia puede tener como máximo ${LIMITES.etiquetasPorIncidencia} etiquetas.`
      return e
    },
    enviar: () => cambiarTags(props.incidencia.id, { agregar: agregar.value, quitar: quitar.value }),
    exito: () => ({ titulo: 'Etiquetas actualizadas', detalle: `${resumen.value[0]?.toUpperCase()}${resumen.value.slice(1)}.` }),
  })
}
</script>

<template>
  <DialogoAccion
    v-model:visible="abierto"
    titulo="Etiquetas"
    :contexto="`${incidencia.folio} · ${incidencia.titulo}`"
    icono-guardar="pi pi-tags"
    :enviando="enviando"
    :sin-cambios="sinCambios"
    :mensaje="mensaje"
    ancho="38rem"
    @guardar="guardar"
    @cerrado="emit('cerrar')"
  >
    <CampoFormulario
      id="quitar"
      etiqueta="Etiquetas actuales"
      :error="primerError(errores, 'quitar')"
      ayuda="Toca una etiqueta para marcarla y quitarla."
    >
      <ul v-if="actuales.length" id="quitar" class="chips" aria-label="Etiquetas actuales">
        <li v-for="t in actuales" :key="t">
          <button
            type="button"
            class="chip"
            :class="{ marcada: quitar.includes(t) }"
            :aria-pressed="quitar.includes(t)"
            :title="quitar.includes(t) ? `${t} (se quitará)` : `Quitar «${t}»`"
            :disabled="enviando"
            @click="alternar(t)"
          >
            <span class="una-linea">{{ t }}</span>
            <i :class="['pi', quitar.includes(t) ? 'pi-undo' : 'pi-times']" aria-hidden="true" />
          </button>
        </li>
      </ul>
      <p v-else class="ninguna">Esta incidencia no tiene etiquetas.</p>
    </CampoFormulario>

    <CampoFormulario
      id="agregar"
      etiqueta="Agregar etiquetas"
      :error="primerError(errores, 'agregar')"
      :ayuda="
        cupo
          ? `Hasta ${cupo} más (máx. ${LIMITES.etiquetasPorIncidencia} por incidencia). ${LIMITES.etiqueta.min}–${LIMITES.etiqueta.max} caracteres: letras, números, espacio, - y _.`
          : `Ya tiene el máximo de ${LIMITES.etiquetasPorIncidencia} etiquetas: quita alguna para agregar otras.`
      "
    >
      <SelectorEtiquetas
        v-model="agregar"
        input-id="agregar"
        :max="cupo"
        :disabled="enviando || !cupo"
        :invalid="!!errores.agregar"
        placeholder="Escribe y presiona Enter…"
      />
    </CampoFormulario>

    <p v-if="resumen" class="resumen">{{ resumen[0]?.toUpperCase() }}{{ resumen.slice(1) }}.</p>
  </DialogoAccion>
</template>

<style scoped>
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.chips li {
  max-width: 100%;
  min-width: 0;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  padding: 4px 10px;
  border: 1px solid var(--outline-variant);
  border-radius: 999px;
  background: var(--surface-container);
  color: var(--on-surface);
  font: inherit;
  cursor: pointer;
}
.chip:hover:not(:disabled) {
  border-color: var(--error);
}
.chip.marcada {
  border-style: dashed;
  border-color: var(--error);
  background: var(--error-container);
  color: var(--on-error-container);
}
.chip.marcada span {
  text-decoration: line-through;
}
.chip .pi {
  font-size: 0.7rem;
}
.ninguna,
.resumen {
  color: var(--on-surface-variant);
}
</style>
