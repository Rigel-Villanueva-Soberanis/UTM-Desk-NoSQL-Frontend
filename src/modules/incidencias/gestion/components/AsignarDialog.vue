<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Skeleton from 'primevue/skeleton'
import { mensajeError } from '@/core/http/errores'
import { normalizarTexto } from '@/core/utils/texto'
import { tecnicos as pedirTecnicos } from '@/modules/usuarios/api/usuarios.api'
import type { TecnicoDisponible } from '@/modules/usuarios/types/usuario.types'
import CampoFormulario from '@/shared/components/CampoFormulario.vue'
import DialogoAccion from '@/shared/components/DialogoAccion.vue'
import { asignarTecnico } from '../../api/gestion.api'
import type { Incidencia } from '../../types/incidencia.types'
import { useAccion } from '@/shared/composables/useAccion'

const props = defineProps<{ incidencia: Pick<Incidencia, 'id' | 'folio' | 'titulo' | 'estado' | 'tecnicoAsignado'> }>()
const emit = defineEmits<{ cerrar: []; actualizar: [] }>()

const { abierto, enviando, errores, mensaje, limpiar, ejecutar } = useAccion(() => emit('actualizar'))

const lista = ref<TecnicoDisponible[]>([])
const cargando = ref(true)
const errorCarga = ref('')
const seleccion = ref('')
const busqueda = ref('')

const actual = computed(() => props.incidencia.tecnicoAsignado)
const reasignando = computed(() => !!actual.value)

/** GET /api/Usuario/tecnicos (activos, de menor a mayor carga; se reordena por si acaso, sin alterar empates). */
async function cargar() {
  cargando.value = true
  errorCarga.value = ''
  try {
    const l = await pedirTecnicos()
    lista.value = l
      .map((t, i) => ({ t, i }))
      .sort((a, b) => (a.t.incidenciasActivas ?? 0) - (b.t.incidenciasActivas ?? 0) || a.i - b.i)
      .map((x) => x.t)
  } catch (e) {
    errorCarga.value = mensajeError(e)
  } finally {
    cargando.value = false
  }
}
onMounted(cargar)

const filtro = ref('todos')

/** Etiquetas de filtro: «Todos», «Disponibles ahora» y una por cada especialidad que exista en la lista. */
const especialidades = computed(() => [...new Set(lista.value.map((t) => t.clasificacion).filter((c): c is string => !!c))].slice(0, 6))

const visibles = computed(() => {
  const q = normalizarTexto(busqueda.value)
  return lista.value.filter((t) => {
    if (filtro.value === 'libres' && (t.incidenciasActivas ?? 0) > 1) return false
    if (filtro.value.startsWith('esp:') && t.clasificacion !== filtro.value.slice(4)) return false
    return !q || normalizarTexto(`${t.nombreCompleto} ${t.clasificacion ?? ''}`).includes(q)
  })
})

/** Recomendado: el de menor carga que no sea el actual (la lista ya viene ordenada de menor a mayor). */
const recomendadoId = computed(() => lista.value.find((t) => t.id !== actual.value?.idUsuario)?.id)

const iniciales = (nombre: string) =>
  nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('')

/** Nivel de carga para el color y la etiqueta de cada técnico. */
function nivel(n = 0) {
  if (n === 0) return { clase: 'baja', texto: 'Disponible inmediato' }
  if (n === 1) return { clase: 'baja', texto: 'Disponible (baja carga)' }
  if (n <= 4) return { clase: 'media', texto: 'Carga media' }
  return { clase: 'alta', texto: 'Carga alta' }
}

watch(seleccion, () => limpiar('idTecnico'))

const carga = (n: number) => (n === 1 ? '1 activa' : `${n ?? 0} activas`)

function guardar() {
  return ejecutar({
    campos: ['idTecnico'],
    validar: () => {
      if (!seleccion.value) return { idTecnico: 'Elige un técnico.' }
      if (seleccion.value === actual.value?.idUsuario) return { idTecnico: 'La incidencia ya está asignada a ese técnico.' }
      return {}
    },
    enviar: () => asignarTecnico(props.incidencia.id, seleccion.value),
    exito: () => {
      const t = lista.value.find((x) => x.id === seleccion.value)
      return {
        titulo: reasignando.value ? 'Técnico reasignado' : 'Técnico asignado',
        detalle: t ? `${t.nombreCompleto} atenderá ${props.incidencia.folio}.` : undefined,
      }
    },
  })
}
</script>

<template>
  <DialogoAccion
    v-model:visible="abierto"
    :titulo="reasignando ? 'Reasignar técnico' : 'Asignar técnico'"
    :contexto="`${incidencia.folio} · ${incidencia.titulo}`"
    :etiqueta-guardar="reasignando ? 'Reasignar técnico' : 'Asignar técnico'"
    :icono-guardar="reasignando ? 'pi pi-arrow-right-arrow-left' : 'pi pi-user-plus'"
    :enviando="enviando"
    :sin-cambios="cargando || !!errorCarga || !lista.length"
    :mensaje="mensaje"
    ancho="42rem"
    @guardar="guardar"
    @cerrado="emit('cerrar')"
  >
    <div v-if="reasignando" class="actual-banner">
      <span class="avatar grande oscuro">{{ iniciales(actual?.nombre ?? '') }}<i class="punto" /></span>
      <span class="datos">
        <small class="etiqueta">Técnico actual responsable</small>
        <strong class="texto-largo">{{ actual?.nombre }}</strong>
      </span>
    </div>
    <p v-else-if="incidencia.estado === 'abierta'" class="nota">
      <i class="pi pi-info-circle" aria-hidden="true" /> Al asignar, la incidencia pasa a «En proceso».
    </p>

    <div v-if="cargando" class="cargando" aria-busy="true">
      <Skeleton height="4rem" />
      <Skeleton height="4rem" />
      <Skeleton height="4rem" />
    </div>

    <div v-else-if="errorCarga" class="vacio">
      <p class="texto-largo">{{ errorCarga }}</p>
      <Button label="Reintentar" icon="pi pi-refresh" severity="secondary" size="small" type="button" @click="cargar" />
    </div>

    <p v-else-if="!lista.length" class="vacio">No hay técnicos activos disponibles.</p>

    <CampoFormulario v-else id="tecnicos" :etiqueta="reasignando ? 'Seleccionar nuevo técnico' : 'Seleccionar técnico'" requerido :error="errores.idTecnico">
      <template #default>
        <div class="buscador">
          <i class="pi pi-search" aria-hidden="true" />
          <InputText v-model="busqueda" placeholder="Buscar técnico por nombre o especialidad…" maxlength="100" aria-label="Buscar técnico" fluid />
        </div>
        <div class="pastillas" role="group" aria-label="Filtrar técnicos">
          <button type="button" class="pastilla" :class="{ on: filtro === 'todos' }" @click="filtro = 'todos'">Todos</button>
          <button type="button" class="pastilla" :class="{ on: filtro === 'libres' }" @click="filtro = 'libres'">Disponibles ahora</button>
          <button
            v-for="e in especialidades"
            :key="e"
            type="button"
            class="pastilla"
            :class="{ on: filtro === `esp:${e}` }"
            @click="filtro = `esp:${e}`"
          >{{ e }}</button>
          <span class="contador" aria-live="polite">{{ visibles.length }} {{ visibles.length === 1 ? 'disponible' : 'disponibles' }}</span>
        </div>

        <div id="tecnicos" class="opciones" role="radiogroup" aria-label="Técnicos disponibles">
          <label v-for="t in visibles" :key="t.id" class="opcion" :class="{ activa: seleccion === t.id, esActual: t.id === actual?.idUsuario }">
            <input v-model="seleccion" type="radio" name="tecnico" :value="t.id" />
            <span class="radio" aria-hidden="true"><i class="pi pi-check" /></span>
            <span class="avatar" :class="nivel(t.incidenciasActivas).clase">{{ iniciales(t.nombreCompleto) }}<i class="punto" /></span>
            <span class="datos">
              <span class="linea">
                <strong class="nombre una-linea" :title="t.nombreCompleto">{{ t.nombreCompleto }}</strong>
                <span v-if="t.id === actual?.idUsuario" class="marca">Técnico actual</span>
                <span v-else-if="t.id === recomendadoId" class="marca verde">Recomendado</span>
              </span>
              <small class="detalle una-linea" :title="t.clasificacion ?? ''">
                <i class="pi pi-wrench" aria-hidden="true" /> {{ t.clasificacion || 'Sin especialidad / Soporte general' }}
              </small>
            </span>
            <span class="insignias">
              <span class="carga">{{ carga(t.incidenciasActivas) }}</span>
              <span class="nivel" :class="nivel(t.incidenciasActivas).clase">{{ nivel(t.incidenciasActivas).texto }}</span>
            </span>
          </label>
          <div v-if="!visibles.length" class="vacio">
            <i class="pi pi-user-minus" aria-hidden="true" />
            <strong>No se encontraron técnicos</strong>
            <span>Intenta ajustar la búsqueda o limpiar los filtros.</span>
          </div>
        </div>
      </template>
    </CampoFormulario>
  </DialogoAccion>
</template>

<style scoped>
.nota {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--on-surface-variant);
}
.actual-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--surface-container);
}
.etiqueta {
  display: block;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--on-surface-variant);
}
.cargando,
.opciones {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.opciones {
  max-height: 21rem;
  overflow-y: auto;
  padding: 2px;
}
.buscador {
  position: relative;
  display: flex;
  align-items: center;
}
.buscador .pi {
  position: absolute;
  left: 12px;
  z-index: 1;
  color: var(--on-surface-variant);
}
.buscador :deep(.p-inputtext) {
  padding-left: 2.4rem;
}
.pastillas {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.pastilla {
  padding: 4px 12px;
  border: 0;
  border-radius: 8px;
  background: var(--surface-container);
  color: var(--on-surface);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.pastilla:hover {
  background: var(--surface-high);
}
.pastilla.on {
  background: #dbeafe;
  color: #1d4ed8;
  box-shadow: 0 0 0 1px #93c5fd inset;
}
.contador {
  margin-left: auto;
  font-size: 0.78rem;
  color: var(--on-surface-variant);
}
.opcion {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--outline-variant);
  border-radius: 12px;
  cursor: pointer;
  background: #fff;
  transition: background 0.15s, border-color 0.15s;
}
.opcion:hover {
  background: var(--surface-low);
}
.opcion.activa {
  border-color: #93c5fd;
  background: #eff6ff;
}
.opcion input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.opcion:has(input:focus-visible) {
  outline: 2px solid var(--accent-soft);
  outline-offset: 2px;
}
.radio {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #cbd5e1;
  background: #fff;
  color: #fff;
  transition: background 0.15s, border-color 0.15s;
}
.radio i {
  font-size: 0.65rem;
  font-weight: 700;
  transform: scale(0);
  transition: transform 0.15s;
}
.opcion:hover .radio {
  border-color: #93c5fd;
}
.opcion.activa .radio {
  background: #3b82f6;
  border-color: #3b82f6;
}
.opcion.activa .radio i {
  transform: scale(1);
}
.avatar {
  position: relative;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--surface-high);
  color: #1e293b;
  font-size: 0.85rem;
  font-weight: 700;
}
.avatar.grande {
  width: 48px;
  height: 48px;
}
.avatar.oscuro {
  background: #dbeafe;
  color: #1d4ed8;
}
.punto {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #94a3b8;
  border: 2px solid #fff;
}
.avatar.baja .punto,
.oscuro .punto {
  background: #10b981;
}
.avatar.media .punto {
  background: #f59e0b;
}
.avatar.alta .punto {
  background: #dc2626;
}
.datos {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  gap: 2px;
}
.linea {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.marca {
  flex-shrink: 0;
  padding: 1px 8px;
  border-radius: 6px;
  background: var(--surface-high);
  font-size: 0.7rem;
  font-weight: 700;
}
.marca.verde {
  background: #d1fae5;
  color: #065f46;
}
.detalle {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--on-surface-variant);
}
.detalle .pi {
  font-size: 0.75rem;
}
.insignias {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}
.carga {
  padding: 1px 8px;
  border-radius: 6px;
  background: var(--surface-container);
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
}
.nivel {
  padding: 1px 8px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}
.nivel.baja {
  background: #d1fae5;
  color: #065f46;
}
.nivel.media {
  background: var(--surface-high);
  color: #475569;
}
.nivel.alta {
  background: #fee2e2;
  color: #991b1b;
}
@media (max-width: 560px) {
  .opcion {
    flex-wrap: wrap;
  }
  .insignias {
    flex-direction: row;
    margin-left: 32px;
  }
}
.vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 20px;
  text-align: center;
  color: var(--on-surface-variant);
}
.vacio .pi {
  font-size: 1.6rem;
}
</style>
