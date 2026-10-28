<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, toRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Skeleton from 'primevue/skeleton'
import NoEncontrado from '@/shared/components/NoEncontrado.vue'
import PantallaVacia from '@/shared/components/PantallaVacia.vue'
import SinPermiso from '@/shared/components/SinPermiso.vue'
import AsignarDialog from '../../gestion/components/AsignarDialog.vue'
import EditarDialog from '../../gestion/components/EditarDialog.vue'
import { useEliminarIncidencia } from '../../gestion/composables/useEliminarIncidencia'
import EstadoDialog from '../../gestion/components/EstadoDialog.vue'
import EtiquetasDialog from '../../gestion/components/EtiquetasDialog.vue'
import EvidenciaDialog from '../../gestion/components/EvidenciaDialog.vue'
import ExternoDialog from '../../gestion/components/ExternoDialog.vue'
import HorasDialog from '../../gestion/components/HorasDialog.vue'
import NotaDialog from '../../gestion/components/NotaDialog.vue'
import type { Accion } from '../../types/incidencia.types'
import BitacoraIncidencia from '../components/BitacoraIncidencia.vue'
import DatosGenerales from '../components/DatosGenerales.vue'
import EncabezadoExpediente from '../components/EncabezadoExpediente.vue'
import GaleriaEvidencias from '../components/GaleriaEvidencias.vue'
import PanelAcciones from '../components/PanelAcciones.vue'
import { useExpediente } from '../composables/useExpediente'

const props = defineProps<{ id: string }>()
const router = useRouter()
const { incidencia, cargando, error, mensaje, recargar, reintentar } = useExpediente(toRef(props, 'id'))

/** Vuelve al listado con los mismos filtros (si venía de él); si no, al listado limpio. */
function volver() {
  if (window.history.state?.back) router.back()
  else router.push('/incidencias')
}

/** Diálogo abierto (uno a la vez). Cada diálogo se monta al abrirlo, así siempre empieza limpio. */
const accion = ref<Accion | null>(null)

/** Guardó (o la incidencia cambió por otro lado): se vuelve a pedir el expediente sin parpadeo. */
const alActualizar = () => void recargar()

/**
 * Bitácora con scroll propio (pantallas anchas) sin barra visible: un degradado arriba/abajo y una flecha
 * avisan que hay más contenido, y desaparecen al llegar al extremo.
 */
const lateral = ref<HTMLElement | null>(null)
const puedeSubir = ref(false)
const puedeBajar = ref(false)
function medirScroll() {
  const el = lateral.value
  if (!el) return
  puedeSubir.value = el.scrollTop > 4
  puedeBajar.value = el.scrollTop + el.clientHeight < el.scrollHeight - 4
}
const bajar = () => lateral.value?.scrollBy({ top: Math.max(160, (lateral.value?.clientHeight ?? 0) * 0.7), behavior: 'smooth' })
let observador: ResizeObserver | null = null
onMounted(() => {
  window.addEventListener('resize', medirScroll)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', medirScroll)
  observador?.disconnect()
})
// La tarjeta aparece cuando llega el expediente (y cambia de alto al recargarlo): se mide y se observa.
watch(lateral, async (el) => {
  observador?.disconnect()
  if (!el) return
  await nextTick()
  medirScroll()
  observador = new ResizeObserver(medirScroll)
  observador.observe(el)
  for (const hijo of Array.from(el.children)) observador.observe(hijo)
})

/** Se eliminó: ya no hay expediente al cual volver, se va al listado. */
function alEliminar() {
  accion.value = null
  void router.replace('/incidencias')
}

/** «Eliminar» no abre un diálogo propio: usa la confirmación de eliminación de toda la app. */
const { pedir: pedirEliminar } = useEliminarIncidencia()
watch(accion, (a) => {
  if (a !== 'eliminar') return
  accion.value = null
  if (incidencia.value) pedirEliminar(incidencia.value, alEliminar, alActualizar)
})
</script>

<template>
  <section class="expediente">
    <Button v-if="!incidencia" label="Volver" icon="pi pi-arrow-left" severity="secondary" text size="small" class="volver" @click="volver" />

    <!-- Carga -->
    <div v-if="cargando" class="tarjeta cargando" aria-busy="true">
      <Skeleton width="30%" height="1rem" />
      <Skeleton width="70%" height="2rem" />
      <Skeleton height="6rem" />
    </div>

    <!-- 403 / 404 / error -->
    <SinPermiso
      v-else-if="error === 'prohibido'"
      titulo="Sin acceso a esta incidencia"
      texto="No tienes permiso para ver este expediente."
    />
    <NoEncontrado
      v-else-if="error === 'no-encontrado'"
      titulo="Incidencia no encontrada"
      texto="La incidencia no existe o ya fue eliminada."
    />
    <div v-else-if="error" class="tarjeta-base">
      <PantallaVacia icono="pi pi-exclamation-triangle" titulo="No se pudo cargar la incidencia" :texto="mensaje">
        <Button label="Reintentar" icon="pi pi-refresh" severity="secondary" @click="reintentar" />
      </PantallaVacia>
    </div>

    <!-- Expediente -->
    <template v-else-if="incidencia">
      <div class="tarjeta cabecera">
        <EncabezadoExpediente :incidencia="incidencia" @volver="volver" />
        <PanelAcciones :incidencia="incidencia" @accion="accion = $event" />
      </div>

      <div class="rejilla">
        <div class="columna">
          <div class="tarjeta"><DatosGenerales :incidencia="incidencia" /></div>
          <div class="tarjeta"><GaleriaEvidencias :incidencia="incidencia" @agregar="accion = 'evidencia'" /></div>
        </div>
        <div ref="lateral" class="tarjeta lateral" @scroll.passive="medirScroll">
          <div class="fade fade-arriba" :class="{ visible: puedeSubir }" aria-hidden="true" />
          <BitacoraIncidencia :historial="incidencia.historialSeguimiento" />
          <button type="button" class="fade fade-abajo" :class="{ visible: puedeBajar }" aria-label="Ver más eventos de la bitácora" :tabindex="puedeBajar ? 0 : -1" @click="bajar">
            <i class="pi pi-chevron-down" aria-hidden="true" />
          </button>
        </div>
      </div>

      <!-- Paso 8: un diálogo por acción -->
      <AsignarDialog v-if="accion === 'asignar'" :incidencia="incidencia" @cerrar="accion = null" @actualizar="alActualizar" />
      <EstadoDialog
        v-else-if="accion === 'estado' || accion === 'resolver' || accion === 'cerrar'"
        :incidencia="incidencia"
        :estado-inicial="accion === 'resolver' ? 'resuelta' : accion === 'cerrar' ? 'cerrada' : undefined"
        @cerrar="accion = null" @actualizar="alActualizar" />
      <NotaDialog v-else-if="accion === 'nota'" :incidencia="incidencia" @cerrar="accion = null" @actualizar="alActualizar" />
      <HorasDialog v-else-if="accion === 'horas'" :incidencia="incidencia" @cerrar="accion = null" @actualizar="alActualizar" />
      <EvidenciaDialog v-else-if="accion === 'evidencia'" :incidencia="incidencia" @cerrar="accion = null" @actualizar="alActualizar" />
      <EtiquetasDialog v-else-if="accion === 'etiquetas'" :incidencia="incidencia" @cerrar="accion = null" @actualizar="alActualizar" />
      <ExternoDialog v-else-if="accion === 'externo'" :incidencia="incidencia" @cerrar="accion = null" @actualizar="alActualizar" />
      <EditarDialog v-else-if="accion === 'editar'" :incidencia="incidencia" @cerrar="accion = null" @actualizar="alActualizar" />
    </template>
  </section>
</template>

<style scoped>
/* Ocupa todo el ancho; tarjetas blancas con esquinas redondeadas (diseño del mockup). */
.expediente {
  width: 100%;
}
.volver {
  margin: 0 0 8px -8px;
}
.tarjeta {
  min-width: 0;
  padding: 24px;
  background: #fff;
  border: 1px solid rgba(226, 232, 240, 0.85);
  border-radius: 16px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
}
.cargando,
.cabecera {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.cabecera {
  margin-bottom: 24px;
  gap: 20px;
}
.rejilla {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}
.columna {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
}
/* Escritorio ancho: 2/3 datos y evidencias, 1/3 bitácora (que se queda a la vista al bajar). */
@media (min-width: 1280px) {
  .rejilla {
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  }
  .lateral {
    position: sticky;
    top: 0;
    max-height: calc(100vh - 8.5rem);
    overflow-y: auto;
    scrollbar-width: none; /* sin barra: los degradados indican que se puede bajar */
  }
  .lateral::-webkit-scrollbar {
    display: none;
  }
}
/* Degradados y flecha de la bitácora (solo existen cuando hay scroll interno) */
.fade {
  position: sticky;
  z-index: 2;
  display: none;
  left: 0;
  right: 0;
  margin-inline: -24px;
  padding: 0;
  border: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s;
}
.fade.visible {
  opacity: 1;
}
.fade-arriba {
  top: 0;
  height: 28px;
  margin-bottom: -28px;
  background: linear-gradient(#fff 15%, rgba(255, 255, 255, 0));
}
.fade-abajo {
  bottom: 0;
  height: 56px;
  margin-top: -56px;
  width: calc(100% + 48px);
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 6px;
  background: linear-gradient(rgba(255, 255, 255, 0), #fff 75%);
  color: #2563eb;
  cursor: pointer;
}
.fade-abajo.visible {
  pointer-events: auto;
}
.fade-abajo .pi {
  font-size: 0.9rem;
  animation: rebote 1.4s ease-in-out infinite;
}
@keyframes rebote {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(3px); }
}
@media (prefers-reduced-motion: reduce) {
  .fade-abajo .pi {
    animation: none;
  }
}
@media (min-width: 1280px) {
  .fade {
    display: flex;
  }
}
@media (max-width: 640px) {
  .tarjeta {
    padding: 16px;
  }
}
</style>
