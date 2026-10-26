<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import AutoComplete from 'primevue/autocomplete'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import { normalizarTexto } from '@/core/utils/texto'
import { LIMITES, limpiarEspacios, normalizarClave, sinControl } from '@/core/utils/validacion'
import CampoError from '@/shared/components/CampoError.vue'
import CampoFormulario from '@/shared/components/CampoFormulario.vue'
import DialogoAccion from '@/shared/components/DialogoAccion.vue'
import { useAccion } from '@/shared/composables/useAccion'
import { agregarElemento, editarElemento } from '../api/catalogos.api'
import { TIPOS_INPUT, type CampoDinamico, type Categoria } from '../types/catalogo.types'
import { limpiarCampo, validarCategoria } from '../utils/validarCatalogo'

const props = defineProps<{ elemento?: Categoria; existentes: string[] }>()
const emit = defineEmits<{ cerrar: []; actualizar: [] }>()
const esNueva = computed(() => !props.elemento)
const MAX_CAMPOS = 20

const { abierto, enviando, errores, mensaje, limpiar, ejecutar } = useAccion(() => emit('actualizar'))
const copia = (c: CampoDinamico[]): CampoDinamico[] => c.map((x) => ({ ...x, opciones: x.opciones ? [...x.opciones] : undefined }))
const form = reactive({
  clave: props.elemento?.clave ?? '',
  nombre: props.elemento?.nombre ?? '',
  campos: copia(props.elemento?.campos_dinamicos ?? []),
})
const limpio = (t: string) => limpiarEspacios(sinControl(t))
const claveManual = ref(false)
const mostrados = ref(0)

watch(() => form.nombre, () => {
  limpiar('nombre')
  if (esNueva.value && !claveManual.value) form.clave = normalizarClave(form.nombre).slice(0, LIMITES.claveCatalogo.max)
})
watch(() => form.clave, () => limpiar('clave'))
watch(() => form.campos, () => limpiar('campos_dinamicos'), { deep: true })

const campoNuevo = (): CampoDinamico => ({ clave: '', etiqueta: '', tipo_input: 'text', requerido: false })
function agregarCampo() {
  if (form.campos.length < MAX_CAMPOS) form.campos.push(campoNuevo())
  mostrados.value++
}
const quitarCampo = (i: number) => form.campos.splice(i, 1)
const mover = (i: number, d: -1 | 1) => {
  const j = i + d
  if (j < 0 || j >= form.campos.length) return
  ;[form.campos[i], form.campos[j]] = [form.campos[j]!, form.campos[i]!]
}
function alCambiarTipo(c: CampoDinamico) {
  if (c.tipo_input === 'select') c.opciones = c.opciones ?? []
  else delete c.opciones
}
function opciones(c: CampoDinamico, v: unknown) {
  c.opciones = (Array.isArray(v) ? v : []).map((x) => limpio(String(x))).filter((x, i, a) => !!x && a.findIndex((y) => normalizarTexto(y) === normalizarTexto(x)) === i)
}
const err = (i: number, k: string) => errores.value[`campos_dinamicos[${i}].${k}`]

const camposLimpios = () => form.campos.map(limpiarCampo)
const sinCambios = computed(() => {
  if (esNueva.value) return false
  return limpio(form.nombre) === props.elemento!.nombre && JSON.stringify(camposLimpios()) === JSON.stringify(props.elemento!.campos_dinamicos.map(limpiarCampo))
})

function guardar() {
  const nombre = limpio(form.nombre)
  const clave = form.clave.trim()
  return ejecutar({
    campos: ['clave', 'nombre', 'campos_dinamicos'],
    validar: () => {
      const e = validarCategoria({ clave, nombre, campos_dinamicos: form.campos }, props.existentes, esNueva.value)
      if (form.campos.length > MAX_CAMPOS) e.campos_dinamicos = `Máximo ${MAX_CAMPOS} campos por categoría.`
      return e
    },
    enviar: () => {
      const campos = camposLimpios()
      return esNueva.value
        ? agregarElemento('categorias_incidencia', { clave, nombre, campos_dinamicos: campos })
        : editarElemento('categorias_incidencia', props.elemento!.clave, {
            ...(nombre !== props.elemento!.nombre ? { nombre } : {}),
            ...(JSON.stringify(campos) !== JSON.stringify(props.elemento!.campos_dinamicos.map(limpiarCampo)) ? { campos_dinamicos: campos } : {}),
          })
    },
    exito: () => ({ titulo: esNueva.value ? 'Categoría agregada' : 'Categoría actualizada', detalle: nombre }),
  })
}
</script>

<template>
  <DialogoAccion
    v-model:visible="abierto"
    :titulo="esNueva ? 'Agregar categoría' : 'Editar categoría'"
    :contexto="esNueva ? '' : `Clave: ${elemento!.clave}`"
    :etiqueta-guardar="esNueva ? 'Agregar' : 'Guardar'"
    :sin-cambios="sinCambios"
    :enviando="enviando"
    :mensaje="mensaje"
    ancho="46rem"
    @guardar="guardar"
    @cerrado="emit('cerrar')"
  >
    <CampoFormulario id="cat-nombre" etiqueta="Nombre" requerido :error="errores.nombre" :contador="{ actual: form.nombre.length, max: LIMITES.textoCatalogo.max }">
      <InputText id="cat-nombre" v-model="form.nombre" :maxlength="LIMITES.textoCatalogo.max" placeholder="Ej. Red e internet" :invalid="!!errores.nombre" :disabled="enviando" fluid />
    </CampoFormulario>
    <CampoFormulario
      v-if="esNueva"
      id="cat-clave"
      etiqueta="Clave"
      requerido
      :error="errores.clave"
      ayuda="Identificador único: minúsculas, números y guion bajo. No se puede cambiar después."
    >
      <InputText id="cat-clave" v-model="form.clave" :maxlength="LIMITES.claveCatalogo.max" autocapitalize="off" :invalid="!!errores.clave" :disabled="enviando" fluid @input="claveManual = true" />
    </CampoFormulario>

    <fieldset class="campos" :class="{ invalido: !!errores.campos_dinamicos }">
      <legend>Campos del formulario ({{ form.campos.length }}/{{ MAX_CAMPOS }})</legend>
      <p v-if="!form.campos.length" class="vacio">Esta categoría no pide datos adicionales.</p>

      <div v-for="(c, i) in form.campos" :key="i" class="campo-din" :data-campo="i">
        <div class="cab">
          <strong>Campo {{ i + 1 }}</strong>
          <span class="mini">
            <Button type="button" icon="pi pi-arrow-up" text rounded size="small" severity="secondary" aria-label="Subir" :disabled="i === 0 || enviando" @click="mover(i, -1)" />
            <Button type="button" icon="pi pi-arrow-down" text rounded size="small" severity="secondary" aria-label="Bajar" :disabled="i === form.campos.length - 1 || enviando" @click="mover(i, 1)" />
            <Button type="button" icon="pi pi-trash" text rounded size="small" severity="danger" aria-label="Quitar campo" :disabled="enviando" @click="quitarCampo(i)" />
          </span>
        </div>
        <div class="fila">
          <CampoFormulario :id="`cd-etiqueta-${i}`" etiqueta="Etiqueta" requerido :error="err(i, 'etiqueta')">
            <InputText :id="`cd-etiqueta-${i}`" v-model="c.etiqueta" :maxlength="LIMITES.textoCatalogo.max" :invalid="!!err(i, 'etiqueta')" :disabled="enviando" fluid />
          </CampoFormulario>
          <CampoFormulario :id="`cd-clave-${i}`" etiqueta="Clave" requerido :error="err(i, 'clave')">
            <InputText :id="`cd-clave-${i}`" v-model="c.clave" :maxlength="LIMITES.claveCatalogo.max" autocapitalize="off" :invalid="!!err(i, 'clave')" :disabled="enviando" fluid />
          </CampoFormulario>
          <CampoFormulario :id="`cd-tipo-${i}`" etiqueta="Tipo" requerido :error="err(i, 'tipo_input')">
            <Select v-model="c.tipo_input" :input-id="`cd-tipo-${i}`" :options="TIPOS_INPUT" option-label="etiqueta" option-value="valor" :disabled="enviando" fluid @change="alCambiarTipo(c)" />
          </CampoFormulario>
        </div>
        <CampoFormulario v-if="c.tipo_input === 'select'" :id="`cd-opciones-${i}`" etiqueta="Opciones" requerido :error="err(i, 'opciones')" ayuda="Escribe una y presiona Enter.">
          <AutoComplete :model-value="c.opciones ?? []" :input-id="`cd-opciones-${i}`" multiple fluid :typeahead="false" :invalid="!!err(i, 'opciones')" :disabled="enviando" @update:model-value="(v) => opciones(c, v)" />
        </CampoFormulario>
        <label class="requerido">
          <Checkbox v-model="c.requerido" binary :input-id="`cd-req-${i}`" :disabled="enviando" />
          Obligatorio al reportar
        </label>
      </div>

      <CampoError :mensaje="errores.campos_dinamicos" />
      <Button type="button" label="Agregar campo" icon="pi pi-plus" size="small" severity="secondary" :disabled="enviando || form.campos.length >= MAX_CAMPOS" @click="agregarCampo" />
    </fieldset>
  </DialogoAccion>
</template>

<style scoped>
.campos {
  border: 1px solid var(--outline-variant, rgba(128, 128, 128, 0.3));
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}
legend {
  font-weight: 700;
  padding: 0 6px;
}
.vacio {
  color: var(--on-surface-variant);
  font-size: 0.875rem;
}
.campo-din {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border-radius: 8px;
  background: var(--surface-low);
}
.cab {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.fila {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}
.requerido {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
</style>
