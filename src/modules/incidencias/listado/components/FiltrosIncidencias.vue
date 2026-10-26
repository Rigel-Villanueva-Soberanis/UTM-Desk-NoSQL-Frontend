<script setup lang="ts">
import { ref, watch } from 'vue'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import DatePicker from 'primevue/datepicker'
import Select from 'primevue/select'
import { usePermisos } from '@/core/auth/usePermisos'
import { aFechaIso, desdeFechaIso } from '@/core/utils/fechas'
import { useCatalogos } from '@/modules/catalogos/composables/useCatalogos'
import CampoError from '@/shared/components/CampoError.vue'
import SelectorEtiquetas from '@/shared/components/SelectorEtiquetas.vue'
import { ESTADOS, PRIORIDADES, type FiltrosIncidencias } from '../../types/incidencia.types'

const props = defineProps<{ modelValue: FiltrosIncidencias; hayFiltros: boolean; ocultarAsignada?: boolean }>()
const emit = defineEmits<{
  cambiar: [parcial: Partial<FiltrosIncidencias>]
  limpiar: []
}>()

const { puede } = usePermisos()
const { categorias, nombresEdificio } = useCatalogos()

const ASIGNADA = [
  { valor: 'true', etiqueta: 'Con técnico asignado' },
  { valor: 'false', etiqueta: 'Sin asignar' },
]

// Fechas: el DatePicker usa Date; la URL y el backend usan "AAAA-MM-DD".
const desde = ref<Date | null>(desdeFechaIso(props.modelValue.fechaDesde))
const hasta = ref<Date | null>(desdeFechaIso(props.modelValue.fechaHasta))
const errorFechas = ref('')

// Si la URL cambia (botón "atrás", limpiar filtros…), se actualizan los controles.
watch(
  () => [props.modelValue.fechaDesde, props.modelValue.fechaHasta],
  ([d, h]) => {
    desde.value = desdeFechaIso(d ?? '')
    hasta.value = desdeFechaIso(h ?? '')
    errorFechas.value = ''
  },
)

const unaFecha = (v: unknown): Date | null => (v instanceof Date ? v : null)

function alCambiarFecha(cual: 'desde' | 'hasta', v: unknown) {
  if (cual === 'desde') desde.value = unaFecha(v)
  else hasta.value = unaFecha(v)

  if (desde.value && hasta.value && desde.value > hasta.value) {
    errorFechas.value = 'La fecha inicial no puede ser posterior a la final.'
    return
  }
  errorFechas.value = ''
  emit('cambiar', {
    fechaDesde: desde.value ? aFechaIso(desde.value) : '',
    fechaHasta: hasta.value ? aFechaIso(hasta.value) : '',
  })
}
</script>

<template>
  <section class="filtros" aria-label="Filtros">
    <div class="rejilla">
      <div class="campo">
        <label for="f-estado">Estado</label>
        <Select
          input-id="f-estado"
          :model-value="modelValue.estado || null"
          :options="ESTADOS"
          option-label="etiqueta"
          option-value="valor"
          placeholder="Todos"
          show-clear
          fluid
          @update:model-value="(v) => emit('cambiar', { estado: v ?? '' })"
        />
      </div>

      <div class="campo">
        <label for="f-prioridad">Prioridad</label>
        <Select
          input-id="f-prioridad"
          :model-value="modelValue.prioridad || null"
          :options="PRIORIDADES"
          option-label="etiqueta"
          option-value="valor"
          placeholder="Todas"
          show-clear
          fluid
          @update:model-value="(v) => emit('cambiar', { prioridad: v ?? '' })"
        />
      </div>

      <div class="campo">
        <label for="f-categoria">Categoría</label>
        <Select
          input-id="f-categoria"
          :model-value="modelValue.categoria || null"
          :options="categorias"
          option-label="nombre"
          option-value="clave"
          placeholder="Todas"
          show-clear
          fluid
          @update:model-value="(v) => emit('cambiar', { categoria: v ?? '' })"
        />
      </div>

      <div class="campo">
        <label for="f-edificio">Edificio</label>
        <Select
          input-id="f-edificio"
          :model-value="modelValue.edificio || null"
          :options="nombresEdificio"
          placeholder="Todos"
          show-clear
          fluid
          @update:model-value="(v) => emit('cambiar', { edificio: v ?? '' })"
        />
      </div>

      <!-- Solo para quien puede asignar (Root, Soporte, Administrativos) -->
      <div v-if="puede('incidencias.asignar') && !ocultarAsignada" class="campo">
        <label for="f-asignada">Asignación</label>
        <Select
          input-id="f-asignada"
          :model-value="modelValue.asignada || null"
          :options="ASIGNADA"
          option-label="etiqueta"
          option-value="valor"
          placeholder="Todas"
          show-clear
          fluid
          @update:model-value="(v) => emit('cambiar', { asignada: v ?? '' })"
        />
      </div>

      <div class="campo">
        <label for="f-tag">Etiqueta</label>
        <SelectorEtiquetas
          input-id="f-tag"
          :model-value="modelValue.tag ? [modelValue.tag] : []"
          :max="1"
          placeholder="Buscar etiqueta…"
          @update:model-value="(v) => emit('cambiar', { tag: v[0] ?? '' })"
        />
      </div>

      <div class="campo">
        <label for="f-desde">Creada desde</label>
        <DatePicker
          input-id="f-desde"
          :model-value="desde"
          date-format="dd/mm/yy"
          placeholder="dd/mm/aaaa"
          show-icon
          show-button-bar
          fluid
          @update:model-value="(v) => alCambiarFecha('desde', v)"
        />
      </div>

      <div class="campo">
        <label for="f-hasta">Creada hasta</label>
        <DatePicker
          input-id="f-hasta"
          :model-value="hasta"
          date-format="dd/mm/yy"
          placeholder="dd/mm/aaaa"
          :invalid="!!errorFechas"
          show-icon
          show-button-bar
          fluid
          @update:model-value="(v) => alCambiarFecha('hasta', v)"
        />
        <CampoError :mensaje="errorFechas" />
      </div>
    </div>

    <div class="pie">
      <label class="externo" for="f-externo">
        <Checkbox
          input-id="f-externo"
          :model-value="modelValue.conProveedorExterno"
          binary
          @update:model-value="(v) => emit('cambiar', { conProveedorExterno: !!v })"
        />
        <span>Solo con proveedor externo</span>
      </label>
      <Button
        v-if="hayFiltros"
        label="Limpiar filtros"
        icon="pi pi-filter-slash"
        severity="secondary"
        text
        size="small"
        @click="emit('limpiar')"
      />
    </div>
  </section>
</template>

<style scoped>
.rejilla {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 16px;
}
.campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
label {
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--on-surface-variant);
}
.pie {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
}
.externo {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: var(--on-surface);
  cursor: pointer;
}
</style>
