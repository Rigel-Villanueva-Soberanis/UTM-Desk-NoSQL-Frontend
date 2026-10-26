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

const visibles = computed(() => {
  const q = normalizarTexto(busqueda.value)
  if (!q) return lista.value
  return lista.value.filter((t) => normalizarTexto(`${t.nombreCompleto} ${t.clasificacion ?? ''}`).includes(q))
})

watch(seleccion, () => limpiar('idTecnico'))

const carga = (n: number) => (n === 1 ? '1 incidencia activa' : `${n ?? 0} incidencias activas`)

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
    :etiqueta-guardar="reasignando ? 'Reasignar' : 'Asignar'"
    icono-guardar="pi pi-user-plus"
    :enviando="enviando"
    :sin-cambios="cargando || !!errorCarga || !lista.length"
    :mensaje="mensaje"
    @guardar="guardar"
    @cerrado="emit('cerrar')"
  >
    <p v-if="reasignando" class="nota">
      Técnico actual: <strong class="texto-largo">{{ actual?.nombre }}</strong>
    </p>
    <p v-else-if="incidencia.estado === 'abierta'" class="nota">Al asignar, la incidencia pasa a «En proceso».</p>

    <div v-if="cargando" class="cargando" aria-busy="true">
      <Skeleton height="3.5rem" />
      <Skeleton height="3.5rem" />
      <Skeleton height="3.5rem" />
    </div>

    <div v-else-if="errorCarga" class="vacio">
      <p class="texto-largo">{{ errorCarga }}</p>
      <Button label="Reintentar" icon="pi pi-refresh" severity="secondary" size="small" type="button" @click="cargar" />
    </div>

    <p v-else-if="!lista.length" class="vacio">No hay técnicos activos disponibles.</p>

    <CampoFormulario v-else id="tecnicos" etiqueta="Técnico" requerido :error="errores.idTecnico">
      <InputText
        v-if="lista.length > 6"
        v-model="busqueda"
        placeholder="Buscar por nombre o especialidad"
        maxlength="100"
        aria-label="Buscar técnico"
        fluid
      />
      <div id="tecnicos" class="opciones" role="radiogroup" aria-label="Técnicos disponibles">
        <label v-for="t in visibles" :key="t.id" class="opcion" :class="{ activa: seleccion === t.id }">
          <input v-model="seleccion" type="radio" name="tecnico" :value="t.id" autofocus />
          <span class="datos">
            <strong class="nombre una-linea" :title="t.nombreCompleto">{{ t.nombreCompleto }}</strong>
            <small class="detalle una-linea" :title="t.clasificacion ?? ''">
              {{ t.clasificacion ? `Especialidad: ${t.clasificacion}` : 'Sin especialidad' }}
            </small>
          </span>
          <span class="carga" :class="{ libre: !t.incidenciasActivas }">{{ carga(t.incidenciasActivas) }}</span>
          <span v-if="t.id === actual?.idUsuario" class="actual">Asignado</span>
        </label>
        <p v-if="!visibles.length" class="vacio">Ningún técnico coincide con la búsqueda.</p>
      </div>
    </CampoFormulario>
  </DialogoAccion>
</template>

<style scoped>
.nota {
  color: var(--on-surface-variant);
}
.cargando,
.opciones {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 20rem;
  overflow-y: auto;
}
.opcion {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--outline-variant);
  border-radius: 10px;
  cursor: pointer;
}
.opcion:hover {
  background: var(--surface-low);
}
.opcion.activa {
  border-color: var(--accent);
  background: var(--surface-container);
}
.opcion:has(input:focus-visible) {
  outline: 2px solid var(--accent-soft);
  outline-offset: 2px;
}
.datos {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.detalle {
  color: var(--on-surface-variant);
}
.carga {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--surface-high);
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}
.carga.libre {
  background: #d1fae5;
  color: #065f46;
}
.actual {
  flex-shrink: 0;
  font-size: 0.75rem;
  color: var(--accent);
  font-weight: 600;
}
.vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  text-align: center;
  color: var(--on-surface-variant);
}
</style>
