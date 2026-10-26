<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import { primerError } from '@/core/http/errores'
import { estaVacio, LIMITES, limpiarDetalle, mensajeLongitud, sinControl } from '@/core/utils/validacion'
import AutoComplete from 'primevue/autocomplete'
import { useCatalogos } from '@/modules/catalogos/composables/useCatalogos'
import { useSelectorUbicacion } from '@/modules/catalogos/composables/useSelectorUbicacion'
import CampoFormulario from '@/shared/components/CampoFormulario.vue'
import DialogoAccion from '@/shared/components/DialogoAccion.vue'
import FormularioDinamico from '@/shared/components/FormularioDinamico.vue'
import { editar } from '../../api/gestion.api'
import type { DetalleEspecifico, Incidencia } from '../../types/incidencia.types'
import { useAccion } from '@/shared/composables/useAccion'

const props = defineProps<{ incidencia: Incidencia }>()
const emit = defineEmits<{ cerrar: []; actualizar: [] }>()

const { abierto, enviando, errores, mensaje, limpiar, ejecutar } = useAccion(() => emit('actualizar'))
const { categoriaPorClave } = useCatalogos()

const inc = props.incidencia
const form = reactive({
  titulo: inc.titulo,
  descripcion: inc.descripcion,
  claveEdificio: inc.ubicacion.clave,
  salon: inc.ubicacion.aula,
  detalleEspecifico: { ...inc.detalleEspecifico } as DetalleEspecifico,
})

const { edificioElegido, salonElegido, sugerenciasEdificio, sugerenciasSalon, buscarEdificio, buscarSalon, valida: ubicacionValida } = useSelectorUbicacion(form)

const categoria = computed(() => categoriaPorClave(inc.categoria))
const campos = computed(() => categoria.value?.campos_dinamicos ?? [])

watch(() => form.titulo, () => limpiar('titulo'))
watch(() => form.descripcion, () => limpiar('descripcion'))
watch(() => form.claveEdificio, () => limpiar('claveEdificio'))
watch(() => form.salon, () => limpiar('salon'))
watch(() => form.detalleEspecifico, () => limpiar('detalleEspecifico'), { deep: true })

/** Solo se mandan los campos de la categoría (si el catálogo cargó); textos recortados y sin vacíos. */
function detalleLimpio(): DetalleEspecifico {
  const d = limpiarDetalle(form.detalleEspecifico)
  if (!campos.value.length) return d
  const claves = new Set(campos.value.map((c) => c.clave))
  return Object.fromEntries(Object.entries(d).filter(([k]) => claves.has(k)))
}

const titulo = computed(() => sinControl(form.titulo).trim())
const descripcion = computed(() => sinControl(form.descripcion).trim())

/** Sin cambios no hay nada que guardar (evita entradas de «edición» vacías en la bitácora). */
const sinCambios = computed(
  () =>
    titulo.value === inc.titulo.trim() &&
    descripcion.value === inc.descripcion.trim() &&
    form.claveEdificio === inc.ubicacion.clave &&
    form.salon === inc.ubicacion.aula &&
    JSON.stringify(Object.entries(detalleLimpio()).sort()) ===
      JSON.stringify(Object.entries(limpiarDetalle(inc.detalleEspecifico)).sort()),
)

function guardar() {
  return ejecutar({
    campos: ['titulo', 'descripcion', 'claveEdificio', 'salon', 'detalleEspecifico'],
    validar: () => {
      const e: Record<string, string> = {}
      if (titulo.value.length < LIMITES.titulo.min || titulo.value.length > LIMITES.titulo.max)
        e.titulo = mensajeLongitud('El título', LIMITES.titulo.min, LIMITES.titulo.max)
      if (descripcion.value.length < LIMITES.descripcion.min || descripcion.value.length > LIMITES.descripcion.max)
        e.descripcion = mensajeLongitud('La descripción', LIMITES.descripcion.min, LIMITES.descripcion.max)
      // Incidencias viejas guardan claves que ya no existen: hay que volver a elegir edificio y salón.
      if (!edificioElegido.value) e.claveEdificio = 'Selecciona un edificio.'
      if (edificioElegido.value && !ubicacionValida.value) e.salon = 'Selecciona un salón.'
      for (const c of campos.value)
        if (c.requerido && estaVacio(form.detalleEspecifico[c.clave])) e[`detalleEspecifico.${c.clave}`] = 'Es obligatorio.'
      return e
    },
    enviar: () =>
      editar(inc.id, {
        titulo: titulo.value,
        descripcion: descripcion.value,
        claveEdificio: form.claveEdificio,
        salon: form.salon,
        detalleEspecifico: detalleLimpio(),
      }),
    exito: () => ({ titulo: 'Incidencia actualizada', detalle: `Los cambios de ${inc.folio} quedaron guardados.` }),
  })
}
</script>

<template>
  <DialogoAccion
    v-model:visible="abierto"
    titulo="Editar incidencia"
    :contexto="`${inc.folio}${categoria ? ` · ${categoria.nombre}` : ''}`"
    icono-guardar="pi pi-check"
    :enviando="enviando"
    :sin-cambios="sinCambios"
    :mensaje="mensaje"
    ancho="46rem"
    @guardar="guardar"
    @cerrado="emit('cerrar')"
  >
    <p class="nota">Aquí se corrige la captura. La categoría, la prioridad y el estado no se pueden cambiar.</p>

    <CampoFormulario
      id="e-titulo"
      etiqueta="Título"
      requerido
      :error="primerError(errores, 'titulo')"
      :contador="{ actual: form.titulo.length, max: LIMITES.titulo.max }"
    >
      <InputText id="e-titulo" v-model="form.titulo" :maxlength="LIMITES.titulo.max" :invalid="!!errores.titulo" :disabled="enviando" autofocus fluid />
    </CampoFormulario>

    <CampoFormulario
      id="e-descripcion"
      etiqueta="Descripción"
      requerido
      :error="primerError(errores, 'descripcion')"
      :contador="{ actual: form.descripcion.length, max: LIMITES.descripcion.max }"
    >
      <Textarea id="e-descripcion" v-model="form.descripcion" rows="5" :maxlength="LIMITES.descripcion.max" auto-resize :invalid="!!errores.descripcion" :disabled="enviando" fluid />
    </CampoFormulario>

    <div class="par">
      <CampoFormulario id="e-edificio" etiqueta="Edificio" requerido :error="primerError(errores, 'claveEdificio')">
        <AutoComplete
          v-model="edificioElegido"
          input-id="e-edificio"
          :suggestions="sugerenciasEdificio"
          option-label="nombre"
          placeholder="Escribe para buscar"
          dropdown
          dropdown-mode="blank"
          force-selection
          complete-on-focus
          :min-length="0"
          :invalid="!!errores.claveEdificio"
          :disabled="enviando"
          fluid
          @complete="buscarEdificio"
        />
      </CampoFormulario>
      <CampoFormulario id="e-salon" etiqueta="Salón" requerido :error="primerError(errores, 'salon')">
        <AutoComplete
          v-model="salonElegido"
          input-id="e-salon"
          :suggestions="sugerenciasSalon"
          :placeholder="edificioElegido ? 'Escribe para buscar' : 'Primero elige el edificio'"
          dropdown
          dropdown-mode="blank"
          force-selection
          complete-on-focus
          :min-length="0"
          :invalid="!!errores.salon"
          :disabled="enviando || !edificioElegido"
          fluid
          @complete="buscarSalon"
        />
      </CampoFormulario>
    </div>

    <fieldset v-if="campos.length" class="detalles">
      <legend>Detalles de la categoría</legend>
      <FormularioDinamico v-model="form.detalleEspecifico" :campos="campos" :errores="errores" :disabled="enviando" />
    </fieldset>
  </DialogoAccion>
</template>

<style scoped>
.par {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
@media (max-width: 560px) {
  .par {
    grid-template-columns: minmax(0, 1fr);
  }
}
.nota {
  color: var(--on-surface-variant);
}
.detalles {
  min-width: 0;
  margin: 0;
  padding: 12px 16px 16px;
  border: 1px solid var(--outline-variant);
  border-radius: 12px;
  background: var(--surface-low);
}
.detalles legend {
  padding: 0 8px;
  font-weight: 600;
}
</style>
