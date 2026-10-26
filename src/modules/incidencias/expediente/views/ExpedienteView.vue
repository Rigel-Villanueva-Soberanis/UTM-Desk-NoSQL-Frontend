<script setup lang="ts">
import { ref, toRef } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Skeleton from 'primevue/skeleton'
import NoEncontrado from '@/shared/components/NoEncontrado.vue'
import PantallaVacia from '@/shared/components/PantallaVacia.vue'
import SinPermiso from '@/shared/components/SinPermiso.vue'
import AsignarDialog from '../../gestion/components/AsignarDialog.vue'
import EditarDialog from '../../gestion/components/EditarDialog.vue'
import EliminarDialog from '../../gestion/components/EliminarDialog.vue'
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

/** Se eliminó: ya no hay expediente al cual volver, se va al listado. */
function alEliminar() {
  accion.value = null
  void router.replace('/incidencias')
}
</script>

<template>
  <section class="expediente">
    <Button label="Volver" icon="pi pi-arrow-left" severity="secondary" text size="small" class="volver" @click="volver" />

    <!-- Carga -->
    <div v-if="cargando" class="tarjeta-base cargando" aria-busy="true">
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
      <div class="tarjeta-base cabecera">
        <EncabezadoExpediente :incidencia="incidencia" />
        <PanelAcciones :incidencia="incidencia" @accion="accion = $event" />
      </div>

      <div class="rejilla">
        <div class="columna">
          <div class="tarjeta-base"><DatosGenerales :incidencia="incidencia" /></div>
          <div class="tarjeta-base"><GaleriaEvidencias :evidencias="incidencia.evidenciasAdjuntas" /></div>
        </div>
        <div class="tarjeta-base lateral"><BitacoraIncidencia :historial="incidencia.historialSeguimiento" /></div>
      </div>

      <!-- Paso 8: un diálogo por acción -->
      <AsignarDialog v-if="accion === 'asignar'" :incidencia="incidencia" @cerrar="accion = null" @actualizar="alActualizar" />
      <EstadoDialog
        v-else-if="accion === 'estado' || accion === 'resolver'"
        :incidencia="incidencia"
        :estado-inicial="accion === 'resolver' ? 'resuelta' : undefined"
        @cerrar="accion = null" @actualizar="alActualizar" />
      <NotaDialog v-else-if="accion === 'nota'" :incidencia="incidencia" @cerrar="accion = null" @actualizar="alActualizar" />
      <HorasDialog v-else-if="accion === 'horas'" :incidencia="incidencia" @cerrar="accion = null" @actualizar="alActualizar" />
      <EvidenciaDialog v-else-if="accion === 'evidencia'" :incidencia="incidencia" @cerrar="accion = null" @actualizar="alActualizar" />
      <EtiquetasDialog v-else-if="accion === 'etiquetas'" :incidencia="incidencia" @cerrar="accion = null" @actualizar="alActualizar" />
      <ExternoDialog v-else-if="accion === 'externo'" :incidencia="incidencia" @cerrar="accion = null" @actualizar="alActualizar" />
      <EditarDialog v-else-if="accion === 'editar'" :incidencia="incidencia" @cerrar="accion = null" @actualizar="alActualizar" />
      <EliminarDialog
        v-else-if="accion === 'eliminar'"
        :incidencia="incidencia"
        @cerrar="accion = null"
        @actualizar="alActualizar"
        @eliminado="alEliminar"
      />
    </template>
  </section>
</template>

<style scoped>
.expediente {
  max-width: 1200px;
}
.volver {
  margin: 0 0 8px -8px;
}
.cargando,
.cabecera {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.cabecera {
  margin-bottom: 16px;
}
.rejilla {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  gap: 16px;
  align-items: start;
}
.columna {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}
@media (max-width: 960px) {
  .rejilla {
    grid-template-columns: 1fr;
  }
}
</style>
