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
import PaginadorMini from '@/shared/components/PaginadorMini.vue'
import { useAccion } from '@/shared/composables/useAccion'
import { agregarElemento, editarElemento } from '../api/catalogos.api'
import { TIPOS_INPUT, type CampoDinamico, type Categoria } from '../types/catalogo.types'
import { limpiarCampo, validarCampos, validarCategoria } from '../utils/validarCatalogo'
import ModalCatalogo from './ModalCatalogo.vue'

/**
 * Tres usos:
 *  · sin `elemento`        → categoría nueva (nombre, clave y sus campos);
 *  · con `elemento`        → editar el nombre y los campos que ya tiene (no se agregan campos aquí);
 *  · con `soloCampos`      → solo agregar campos nuevos a una categoría que ya existe (el «+» de su fila).
 */
const props = defineProps<{ elemento?: Categoria; existentes: string[]; soloCampos?: boolean }>()
const emit = defineEmits<{ cerrar: []; actualizar: [] }>()
const modo = computed<'nueva' | 'editar' | 'campos'>(() => (!props.elemento ? 'nueva' : props.soloCampos ? 'campos' : 'editar'))
const MAX_CAMPOS = 20
const POR_PAGINA = 4

const { abierto, enviando, errores, mensaje, limpiar, ejecutar } = useAccion(() => emit('actualizar'))
const copia = (c: CampoDinamico[]): CampoDinamico[] => c.map((x) => ({ ...x, opciones: x.opciones ? [...x.opciones] : undefined }))
const campoNuevo = (): CampoDinamico => ({ clave: '', etiqueta: '', tipo_input: 'text', requerido: false })
const yaTiene = computed(() => props.elemento?.campos_dinamicos.length ?? 0)
/** En «solo campos» los índices del backend cuentan también los campos que ya existen. */
const desfase = computed(() => (modo.value === 'campos' ? yaTiene.value : 0))
const limite = computed(() => (modo.value === 'campos' ? MAX_CAMPOS - yaTiene.value : MAX_CAMPOS))

const form = reactive({
  clave: props.elemento?.clave ?? '',
  nombre: props.elemento?.nombre ?? '',
  campos: modo.value === 'campos' ? [campoNuevo()] : copia(props.elemento?.campos_dinamicos ?? []),
})
const limpio = (t: string) => limpiarEspacios(sinControl(t))
const claveManual = ref(false)
const pagina = ref(1)

watch(() => form.nombre, () => {
  limpiar('nombre')
  if (modo.value === 'nueva' && !claveManual.value) form.clave = normalizarClave(form.nombre).slice(0, LIMITES.claveCatalogo.max)
})
watch(() => form.clave, () => limpiar('clave'))
watch(() => form.campos, () => limpiar('campos_dinamicos'), { deep: true })

const visibles = computed(() => form.campos.map((c, i) => ({ c, i })).slice((pagina.value - 1) * POR_PAGINA, pagina.value * POR_PAGINA))
const puedeAgregar = computed(() => modo.value !== 'editar' && form.campos.length < limite.value)

function agregarCampo() {
  if (form.campos.length >= limite.value) return
  form.campos.push(campoNuevo())
  pagina.value = Math.ceil(form.campos.length / POR_PAGINA)
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
const err = (i: number, k: string) => errores.value[`campos_dinamicos[${i + desfase.value}].${k}`]

/** Lleva la lista a la página del primer campo con error, para poder verlo y enfocarlo. */
function irAlPrimerError(e: Record<string, string>) {
  const idx = Object.keys(e)
    .map((k) => /^campos_dinamicos\[(\d+)\]/.exec(k)?.[1])
    .filter((x): x is string => x !== undefined)
    .map((x) => Number(x) - desfase.value)
    .filter((x) => x >= 0)
  if (idx.length) pagina.value = Math.floor(Math.min(...idx) / POR_PAGINA) + 1
}

const camposLimpios = () => form.campos.map(limpiarCampo)
const sinCambios = computed(() => {
  if (modo.value !== 'editar') return false
  return limpio(form.nombre) === props.elemento!.nombre && JSON.stringify(camposLimpios()) === JSON.stringify(props.elemento!.campos_dinamicos.map(limpiarCampo))
})

function guardar() {
  const nombre = limpio(form.nombre)
  const clave = form.clave.trim()
  return ejecutar({
    campos: ['clave', 'nombre', 'campos_dinamicos'],
    validar: () => {
      let e: Record<string, string>
      if (modo.value === 'campos') e = validarCampos([...copia(props.elemento!.campos_dinamicos), ...form.campos])
      else e = validarCategoria({ clave, nombre, campos_dinamicos: form.campos }, props.existentes, modo.value === 'nueva')
      if (modo.value !== 'campos' && form.campos.length > MAX_CAMPOS) e.campos_dinamicos = `Máximo ${MAX_CAMPOS} campos por categoría.`
      if (modo.value === 'campos' && form.campos.length > limite.value) e.campos_dinamicos = `Máximo ${MAX_CAMPOS} campos por categoría.`
      irAlPrimerError(e)
      return e
    },
    enviar: () => {
      const campos = camposLimpios()
      if (modo.value === 'nueva') return agregarElemento('categorias_incidencia', { clave, nombre, campos_dinamicos: campos })
      if (modo.value === 'campos')
        return editarElemento('categorias_incidencia', props.elemento!.clave, {
          campos_dinamicos: [...props.elemento!.campos_dinamicos.map(limpiarCampo), ...campos],
        })
      return editarElemento('categorias_incidencia', props.elemento!.clave, {
        ...(nombre !== props.elemento!.nombre ? { nombre } : {}),
        ...(JSON.stringify(campos) !== JSON.stringify(props.elemento!.campos_dinamicos.map(limpiarCampo)) ? { campos_dinamicos: campos } : {}),
      })
    },
    exito: () =>
      modo.value === 'campos'
        ? { titulo: form.campos.length === 1 ? 'Campo agregado' : 'Campos agregados', detalle: props.elemento!.nombre }
        : { titulo: modo.value === 'nueva' ? 'Categoría agregada' : 'Categoría actualizada', detalle: nombre },
  })
}

const titulo = computed(() => ({ nueva: 'Agregar categoría', editar: 'Editar categoría', campos: 'Agregar campos' })[modo.value])
const descripcion = computed(() => {
  if (modo.value === 'nueva') return 'Crea un tipo de falla y los campos que se piden al reportarla.'
  if (modo.value === 'editar') return 'Modifica el nombre de la categoría y sus campos del formulario.'
  return `Nuevos campos para «${props.elemento!.nombre}». Hoy tiene ${yaTiene.value} de ${MAX_CAMPOS}.`
})
const etiquetaGuardar = computed(() => (modo.value === 'nueva' ? 'Agregar' : modo.value === 'campos' ? (form.campos.length > 1 ? `Agregar ${form.campos.length} campos` : 'Agregar campo') : 'Guardar'))
const estado = computed(() => {
  if (modo.value === 'campos') return `${form.campos.length} ${form.campos.length === 1 ? 'campo por agregar' : 'campos por agregar'}`
  if (modo.value === 'editar') return sinCambios.value ? 'Sin cambios pendientes' : 'Cambios sin guardar'
  return `${form.campos.length} ${form.campos.length === 1 ? 'campo' : 'campos'} en el formulario`
})
</script>

<template>
  <ModalCatalogo
    v-model:visible="abierto"
    :titulo="titulo"
    :descripcion="descripcion"
    :icono="modo === 'campos' ? 'pi pi-plus' : 'pi pi-tags'"
    :etiqueta-guardar="etiquetaGuardar"
    :sin-cambios="sinCambios"
    :enviando="enviando"
    :mensaje="mensaje"
    :estado="estado"
    :estado-ok="modo === 'campos' ? form.campos.length > 0 : !sinCambios"
    ancho="46rem"
    @guardar="guardar"
    @cerrado="emit('cerrar')"
  >
    <template v-if="modo !== 'nueva'" #titulo-extra>
      <span class="clave-fija" :title="`Clave: ${elemento!.clave}`"><span class="k">clave:</span> {{ elemento!.clave }}</span>
    </template>

    <CampoFormulario v-if="modo !== 'campos'" id="cat-nombre" etiqueta="Nombre" requerido :error="errores.nombre" :contador="{ actual: form.nombre.length, max: LIMITES.textoCatalogo.max }">
      <InputText id="cat-nombre" v-model="form.nombre" :maxlength="LIMITES.textoCatalogo.max" placeholder="Ej. Red e internet" autocomplete="off" :invalid="!!errores.nombre" :disabled="enviando" fluid @keydown.enter.prevent />
    </CampoFormulario>
    <CampoFormulario
      v-if="modo === 'nueva'"
      id="cat-clave"
      etiqueta="Clave"
      requerido
      :error="errores.clave"
      ayuda="Identificador único: minúsculas, números y guion bajo. No se puede cambiar después."
    >
      <InputText id="cat-clave" v-model="form.clave" :maxlength="LIMITES.claveCatalogo.max" autocapitalize="off" autocomplete="off" :invalid="!!errores.clave" :disabled="enviando" fluid @input="claveManual = true" @keydown.enter.prevent />
    </CampoFormulario>

    <fieldset class="campos" :class="{ invalido: !!errores.campos_dinamicos }">
      <legend>{{ modo === 'campos' ? `Nuevos campos (${form.campos.length}/${limite})` : `Campos del formulario (${form.campos.length}/${MAX_CAMPOS})` }}</legend>
      <p v-if="!form.campos.length" class="vacio">
        {{ modo === 'editar' ? 'Esta categoría no tiene campos adicionales. Agrégalos con el «+» de su fila.' : 'Esta categoría no pide datos adicionales.' }}
      </p>

      <div v-for="{ c, i } in visibles" :key="i" class="campo-din" :data-campo="i">
        <div class="cab">
          <strong>{{ modo === 'campos' ? 'Campo nuevo' : 'Campo' }} {{ i + 1 }}</strong>
          <span class="mini">
            <Button v-if="modo !== 'campos'" type="button" icon="pi pi-arrow-up" text rounded size="small" severity="secondary" aria-label="Subir" :disabled="i === 0 || enviando" @click="mover(i, -1)" />
            <Button v-if="modo !== 'campos'" type="button" icon="pi pi-arrow-down" text rounded size="small" severity="secondary" aria-label="Bajar" :disabled="i === form.campos.length - 1 || enviando" @click="mover(i, 1)" />
            <Button type="button" icon="pi pi-trash" text rounded size="small" severity="danger" :aria-label="modo === 'campos' ? 'Descartar campo' : 'Quitar campo'" :disabled="enviando || (modo === 'campos' && form.campos.length === 1)" @click="quitarCampo(i)" />
          </span>
        </div>
        <div class="fila">
          <CampoFormulario :id="`cd-etiqueta-${i}`" etiqueta="Etiqueta" requerido :error="err(i, 'etiqueta')">
            <InputText :id="`cd-etiqueta-${i}`" v-model="c.etiqueta" :maxlength="LIMITES.textoCatalogo.max" autocomplete="off" :invalid="!!err(i, 'etiqueta')" :disabled="enviando" fluid @keydown.enter.prevent />
          </CampoFormulario>
          <CampoFormulario :id="`cd-clave-${i}`" etiqueta="Clave" requerido :error="err(i, 'clave')">
            <InputText :id="`cd-clave-${i}`" v-model="c.clave" :maxlength="LIMITES.claveCatalogo.max" autocapitalize="off" autocomplete="off" :invalid="!!err(i, 'clave')" :disabled="enviando" fluid @keydown.enter.prevent />
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

      <PaginadorMini v-model="pagina" :total="form.campos.length" :tamano="POR_PAGINA" />
      <CampoError :mensaje="errores.campos_dinamicos" />
      <Button v-if="modo !== 'editar'" type="button" :label="modo === 'campos' ? 'Agregar otro campo' : 'Agregar campo'" icon="pi pi-plus" size="small" severity="secondary" :disabled="enviando || !puedeAgregar" @click="agregarCampo" />
    </fieldset>
  </ModalCatalogo>
</template>

<style scoped>
.campos {
  border: 1px solid var(--outline-variant, rgba(128, 128, 128, 0.3));
  border-radius: 12px;
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
  margin: 0;
  color: var(--on-surface-variant);
  font-size: 0.875rem;
}
.campo-din {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border-radius: 10px;
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
.clave-fija {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  border-radius: 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.72rem;
  background: var(--surface-low);
  border: 1px solid var(--outline-variant, rgba(100, 116, 139, 0.3));
}
.clave-fija .k {
  opacity: 0.6;
}
</style>
