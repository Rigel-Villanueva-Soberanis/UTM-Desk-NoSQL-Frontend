<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { primerError } from '@/core/http/errores'
import { LIMITES } from '@/core/utils/validacion'
import CampoError from '@/shared/components/CampoError.vue'
import DialogoAccion from '@/shared/components/DialogoAccion.vue'
import EtiquetaTag from '@/shared/components/EtiquetaTag.vue'
import SelectorEtiquetas from '@/shared/components/SelectorEtiquetas.vue'
import { cambiarTags } from '../../api/gestion.api'
import type { Incidencia } from '../../types/incidencia.types'
import { useAccion } from '@/shared/composables/useAccion'

const props = defineProps<{ incidencia: Incidencia }>()
const emit = defineEmits<{ cerrar: []; actualizar: [] }>()

const { abierto, enviando, errores, mensaje, limpiar, ejecutar } = useAccion(() => emit('actualizar'))

const agregar = ref<string[]>([])
const quitar = ref<string[]>([])
/**
 * Si ya se mostró un error, se vuelve a evaluar con cada cambio: el mensaje sigue en pantalla
 * mientras haya etiquetas con problema y va quitando de la lista las que se corrigen.
 */
function reevaluar() {
  if (!errores.value.agregar && !errores.value.quitar) return
  limpiar('agregar', 'quitar')
  Object.assign(errores.value, validarCambios())
}
watch(agregar, reevaluar)
watch(quitar, reevaluar)

const actuales = computed(() => props.incidencia.tags)

/** Cuántas etiquetas más caben: máx. 15 por incidencia (contando las que se van a quitar) y 10 por envío. */
const cupo = computed(() =>
  Math.max(0, Math.min(LIMITES.etiquetasPorLista, LIMITES.etiquetasPorIncidencia - actuales.value.length + quitar.value.length)),
)
const sinCambios = computed(() => !agregar.value.length && !quitar.value.length)

function alternar(tag: string) {
  quitar.value = quitar.value.includes(tag) ? quitar.value.filter((t) => t !== tag) : [...quitar.value, tag]
}

const quitarNueva = (tag: string) => (agregar.value = agregar.value.filter((t) => t !== tag))

const resumen = computed(() => {
  const partes: string[] = []
  if (agregar.value.length) partes.push(`${agregar.value.length} agregada${agregar.value.length === 1 ? '' : 's'}`)
  if (quitar.value.length) partes.push(`${quitar.value.length} quitada${quitar.value.length === 1 ? '' : 's'}`)
  return partes.join(' y ')
})

function validarCambios(): Record<string, string> {
    const e: Record<string, string> = {}
    const lista = (l: string[]) => l.map((t) => `«${t}»`).join(', ')
    const repetidas = agregar.value.filter((t) => actuales.value.includes(t) && !quitar.value.includes(t))
    const enAmbas = agregar.value.filter((t) => quitar.value.includes(t))
    // Se revisan todas las nuevas contra las actuales de una vez y se avisa de todos los problemas juntos.
    const problemas: string[] = []
    if (repetidas.length)
      problemas.push(repetidas.length === 1 ? `La incidencia ya tiene la etiqueta ${lista(repetidas)}.` : `La incidencia ya tiene estas etiquetas: ${lista(repetidas)}.`)
    if (enAmbas.length)
      problemas.push(enAmbas.length === 1 ? `${lista(enAmbas)} no puede agregarse y quitarse a la vez.` : `${lista(enAmbas)} no pueden agregarse y quitarse a la vez.`)
    if (agregar.value.length > LIMITES.etiquetasPorLista) problemas.push(`Máximo ${LIMITES.etiquetasPorLista} etiquetas por envío.`)
    if (actuales.value.length - quitar.value.length + agregar.value.length > LIMITES.etiquetasPorIncidencia)
      problemas.push(`Una incidencia puede tener como máximo ${LIMITES.etiquetasPorIncidencia} etiquetas.`)
    if (problemas.length) e.agregar = problemas.join(' ')
    else if (quitar.value.length > LIMITES.etiquetasPorLista) e.quitar = `Máximo ${LIMITES.etiquetasPorLista} etiquetas por envío.`
    return e
}

function guardar() {
  return ejecutar({
    campos: ['agregar', 'quitar'],
    validar: validarCambios,
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
    ancho="40rem"
    @guardar="guardar"
    @cerrado="emit('cerrar')"
  >
    <section class="bloque">
      <header class="cabecera">
        <h3><i class="pi pi-tag" aria-hidden="true" /> Etiquetas actuales</h3>
        <span class="cuenta">{{ actuales.length }} de {{ LIMITES.etiquetasPorIncidencia }}</span>
      </header>
      <ul v-if="actuales.length" id="quitar" class="chips" aria-label="Etiquetas actuales">
        <li v-for="t in actuales" :key="t">
          <EtiquetaTag
            :texto="t"
            :accion="quitar.includes(t) ? 'pi-undo' : 'pi-times'"
            :marcada="quitar.includes(t)"
            :titulo="quitar.includes(t) ? `${t} (se quitará): clic para conservarla` : `Quitar «${t}»`"
            :disabled="enviando"
            @click="alternar(t)"
          />
        </li>
      </ul>
      <p v-else class="ninguna">Esta incidencia no tiene etiquetas todavía.</p>
      <p v-if="actuales.length" class="ayuda">Toca una etiqueta para marcarla y quitarla.</p>
      <CampoError :mensaje="primerError(errores, 'quitar')" />
    </section>

    <section class="bloque">
      <header class="cabecera">
        <h3><i class="pi pi-plus-circle" aria-hidden="true" /> Agregar etiquetas</h3>
        <span v-if="cupo" class="cuenta">Caben {{ cupo }} más</span>
      </header>
      <SelectorEtiquetas
        v-model="agregar"
        input-id="agregar"
        :max="cupo"
        :disabled="enviando || !cupo"
        :invalid="!!errores.agregar"
        ocultar-elegidas
        placeholder="Busca o escribe una etiqueta y presiona Enter…"
      />
      <p class="ayuda">
        {{
          cupo
            ? `${LIMITES.etiqueta.min}–${LIMITES.etiqueta.max} caracteres: letras, números, espacio, - y _. Máx. ${LIMITES.etiquetasPorIncidencia} por incidencia.`
            : `Ya tiene el máximo de ${LIMITES.etiquetasPorIncidencia} etiquetas: quita alguna para agregar otras.`
        }}
      </p>
      <CampoError :mensaje="primerError(errores, 'agregar')" />

      <div v-if="agregar.length" class="nuevas">
        <p class="titulo-nuevas"><i class="pi pi-sparkles" aria-hidden="true" /> Etiquetas nuevas <span class="cuenta">{{ agregar.length }}</span></p>
        <ul class="chips" aria-label="Etiquetas nuevas">
          <li v-for="t in agregar" :key="t">
            <EtiquetaTag :texto="t" accion="pi-times" :titulo="`Quitar «${t}»`" :disabled="enviando" @click="quitarNueva(t)" />
          </li>
        </ul>
      </div>
    </section>

    <p v-if="resumen" class="resumen"><i class="pi pi-info-circle" aria-hidden="true" /> {{ resumen[0]?.toUpperCase() }}{{ resumen.slice(1) }}.</p>
  </DialogoAccion>
</template>

<style scoped>
.bloque {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px 22px;
  border: 1px solid var(--outline-variant);
  border-radius: 14px;
  background: #fff;
}
.cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
h3 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #64748b;
}
h3 .pi {
  font-size: 0.85rem;
}
.cuenta {
  padding: 2px 10px;
  border-radius: 999px;
  background: var(--surface-container);
  color: var(--on-surface-variant);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
}
.ayuda,
.ninguna {
  margin: 0;
  color: var(--on-surface-variant);
  font-size: 0.85rem;
  line-height: 1.5;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.chips li {
  max-width: 100%;
  min-width: 0;
}
.nuevas {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--outline-variant);
}
.titulo-nuevas {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #64748b;
}
.resumen {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: var(--on-surface-variant);
  font-size: 0.88rem;
}
</style>
