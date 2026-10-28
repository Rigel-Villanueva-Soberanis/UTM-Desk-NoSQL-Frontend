<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import Button from 'primevue/button'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import { aviso } from '@/core/http/avisos'
import { aMapa, mensajeError, primerError } from '@/core/http/errores'
import { normalizarTexto } from '@/core/utils/texto'
import { LIMITES, limpiarEspacios, normalizarClave, sinControl } from '@/core/utils/validacion'
import CampoFormulario from '@/shared/components/CampoFormulario.vue'
import PaginadorMini from '@/shared/components/PaginadorMini.vue'
import { useAccion } from '@/shared/composables/useAccion'
import { agregarElemento, editarElemento, renombrarSalon } from '../api/catalogos.api'
import type { Edificio } from '../types/catalogo.types'
import { validarEdificio, validarSalones } from '../utils/validarCatalogo'
import EditorSalones from './EditorSalones.vue'
import ModalCatalogo from './ModalCatalogo.vue'

/**
 * Nuevo edificio (con sus salones, opcional) o edición de uno existente:
 * su nombre (se guarda con «Guardar») y el nombre de cada salón (se guarda al confirmar cada uno).
 * Los salones nuevos de un edificio existente se agregan con el «+» de su fila (AgregarSalonesDialog).
 */
const props = defineProps<{ elemento?: Edificio; existentes: string[] }>()
const emit = defineEmits<{ cerrar: []; actualizar: [] }>()
const esNuevo = computed(() => !props.elemento)

const { abierto, enviando, errores, mensaje, limpiar, ejecutar } = useAccion(() => emit('actualizar'))
const form = reactive({ clave: props.elemento?.clave ?? '', edificio: props.elemento?.edificio ?? '' })
const salonesNuevos = ref<string[]>([])
const claveManual = ref(false)
const limpio = (t: string) => limpiarEspacios(sinControl(t))

// La clave se sugiere a partir del nombre mientras no se escriba a mano ("Edificio D" → "edificio_d").
watch(
  () => form.edificio,
  () => {
    limpiar('edificio')
    if (esNuevo.value && !claveManual.value) form.clave = normalizarClave(form.edificio).slice(0, LIMITES.claveCatalogo.max)
  },
)
watch(() => form.clave, () => limpiar('clave'))

const sinCambios = computed(() => (esNuevo.value ? false : limpio(form.edificio) === props.elemento!.edificio))
const completo = computed(() => !!limpio(form.edificio) && (!esNuevo.value || !!form.clave.trim()))
const estado = computed(() =>
  esNuevo.value
    ? completo.value ? 'Campos requeridos completos' : 'Faltan campos requeridos'
    : renombrando.value !== null ? `Editando «${renombrando.value}»: confirma con ✓ o cancela`
    : sinCambios.value ? 'Sin cambios pendientes en el nombre' : 'Nombre modificado, sin guardar',
)

function guardar() {
  const edificio = limpio(form.edificio)
  const clave = form.clave.trim()
  const salones = salonesNuevos.value
  return ejecutar({
    campos: ['clave', 'edificio', 'salones'],
    validar: () => validarEdificio({ clave, edificio, salones }, props.existentes, esNuevo.value),
    enviar: () =>
      esNuevo.value
        ? agregarElemento('edificios', { clave, edificio, ...(salones.length ? { salones } : {}) })
        : editarElemento('edificios', props.elemento!.clave, { edificio }),
    exito: () =>
      esNuevo.value
        ? { titulo: 'Edificio agregado', detalle: `${edificio} ya aparece al reportar fallas.` }
        : { titulo: 'Edificio actualizado', detalle: edificio },
  })
}

// ── Renombrar salones (solo al editar): cada cambio se guarda al momento ──
const salones = ref<string[]>(props.elemento ? [...props.elemento.salones] : [])
const filtro = ref('')
const POR_PAGINA = 6
const pagina = ref(1)
watch(filtro, () => { pagina.value = 1 })
const coinciden = computed(() => {
  const q = normalizarTexto(filtro.value.trim())
  return q ? salones.value.filter((x) => normalizarTexto(x).includes(q)) : salones.value
})
const visibles = computed(() => coinciden.value.slice((pagina.value - 1) * POR_PAGINA, pagina.value * POR_PAGINA))
const renombrando = ref<string | null>(null)
const nombre = ref('')
const errorNombre = ref('')
const trabajando = ref(false)

async function empezar(s: string) {
  renombrando.value = s
  nombre.value = s
  errorNombre.value = ''
  await nextTick()
  document.querySelector<HTMLInputElement>('#ed-renombrar')?.focus()
}
function cancelar() {
  renombrando.value = null
  errorNombre.value = ''
}
async function guardarNombre() {
  const actual = renombrando.value
  if (actual === null || trabajando.value) return
  const nuevo = limpio(nombre.value)
  errorNombre.value = ''
  if (nuevo === actual) return cancelar()
  const problema = validarSalones([nuevo], salones.value.filter((x) => x !== actual))
  if (problema) {
    errorNombre.value = problema
    return
  }
  trabajando.value = true
  try {
    const r = await renombrarSalon(props.elemento!.clave, actual, nuevo)
    salones.value = r && Array.isArray(r.salones) ? [...r.salones] : salones.value.map((x) => (x === actual ? nuevo : x))
    renombrando.value = null
    emit('actualizar')
    aviso('success', 'Salón renombrado', `${actual} → ${nuevo}`)
  } catch (e) {
    const m = aMapa(e)
    errorNombre.value = m.salon || mensajeError(e)
  } finally {
    trabajando.value = false
  }
}
</script>

<template>
  <ModalCatalogo
    v-model:visible="abierto"
    :titulo="esNuevo ? 'Agregar nuevo edificio' : 'Editar edificio'"
    :descripcion="esNuevo ? 'Registra un nuevo edificio en el campus y asigna sus aulas o laboratorios iniciales.' : 'Modifica el nombre del edificio y el de sus salones o espacios asociados.'"
    :etiqueta-guardar="esNuevo ? 'Guardar y registrar' : 'Guardar'"
    :sin-cambios="sinCambios || !completo || trabajando || renombrando !== null"
    :enviando="enviando"
    :mensaje="mensaje"
    :estado="estado"
    :estado-ok="esNuevo ? completo : false"
    @guardar="guardar"
    @cerrado="emit('cerrar')"
  >
    <template v-if="!esNuevo" #titulo-extra>
      <span class="clave-fija" :title="`Clave: ${elemento!.clave}`"><span class="k">clave:</span> {{ elemento!.clave }} <span class="bloq">Bloqueada</span></span>
    </template>

    <CampoFormulario
      id="ed-edificio"
      etiqueta="Nombre del edificio"
      requerido
      :error="primerError(errores, 'edificio')"
      ayuda="Nombre con el que docentes y alumnos ubican el espacio."
      :contador="{ actual: form.edificio.length, max: LIMITES.textoCatalogo.max }"
    >
      <InputText id="ed-edificio" v-model="form.edificio" :maxlength="LIMITES.textoCatalogo.max" placeholder="Ej. Edificio D (Posgrados e Innovación)" autocomplete="off" :invalid="!!errores.edificio" :disabled="enviando" fluid @keydown.enter.prevent />
    </CampoFormulario>

    <template v-if="esNuevo">
      <CampoFormulario
        id="ed-clave"
        etiqueta="Clave técnica"
        requerido
        :error="primerError(errores, 'clave')"
        ayuda="Identificador único: minúsculas, números y guion bajo. No se puede cambiar después."
      >
        <InputText id="ed-clave" v-model="form.clave" :maxlength="LIMITES.claveCatalogo.max" placeholder="ej. edificio_d" autocapitalize="off" autocomplete="off" :invalid="!!errores.clave" :disabled="enviando" class="mono" fluid @input="claveManual = true" @keydown.enter.prevent />
      </CampoFormulario>

      <EditorSalones v-model="salonesNuevos" :error="primerError(errores, 'salones')" :disabled="enviando" @cambio="limpiar('salones')" />
    </template>

    <section v-else class="existentes">
      <div class="titulo">
        <span class="t">Salones y espacios asociados</span>
        <span class="cuenta">{{ salones.length }} {{ salones.length === 1 ? 'salón' : 'salones' }}</span>
      </div>
      <IconField v-if="salones.length > POR_PAGINA">
        <InputIcon class="pi pi-search" />
        <InputText v-model="filtro" maxlength="100" placeholder="Filtrar salones…" aria-label="Filtrar salones" autocomplete="off" fluid @keydown.enter.prevent />
      </IconField>
      <p v-if="!salones.length" class="vacio">Este edificio aún no tiene salones. Agrégalos con el «+» de su fila.</p>
      <p v-else-if="!coinciden.length" class="vacio">Ningún salón coincide con «{{ filtro }}».</p>
      <ul v-else class="lista">
        <li v-for="s in visibles" :key="s" class="fila" :class="{ activa: renombrando === s }">
          <template v-if="renombrando === s">
            <span class="edicion">
              <span class="dot activo" />
              <InputText id="ed-renombrar" v-model="nombre" :maxlength="LIMITES.textoCatalogo.max" :invalid="!!errorNombre" :disabled="trabajando" aria-label="Nuevo nombre del salón" fluid @keydown.enter.prevent="guardarNombre" @keydown.esc.stop.prevent="cancelar" />
              <Button type="button" icon="pi pi-check" size="small" rounded text :loading="trabajando" aria-label="Confirmar cambio" title="Confirmar cambio" data-accion="guardar-salon" @click="guardarNombre" />
              <Button type="button" icon="pi pi-times" size="small" rounded text severity="secondary" :disabled="trabajando" aria-label="Cancelar edición" title="Cancelar edición" @click="cancelar" />
            </span>
            <small v-if="errorNombre" class="error">{{ errorNombre }}</small>
          </template>
          <template v-else>
            <span class="dot" />
            <span class="nombre" :title="s">{{ s }}</span>
            <Button type="button" icon="pi pi-pencil" size="small" rounded text severity="secondary" :aria-label="`Editar nombre de ${s}`" title="Editar nombre" :disabled="trabajando || enviando" data-accion="renombrar-salon" @click="empezar(s)" />
          </template>
        </li>
      </ul>
      <PaginadorMini v-model="pagina" :total="coinciden.length" :tamano="POR_PAGINA" />
    </section>
  </ModalCatalogo>
</template>

<style scoped>
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.existentes {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--outline-variant, rgba(100, 116, 139, 0.2));
}
.titulo {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.t {
  font-weight: 700;
  font-size: 0.9rem;
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
.bloq {
  padding: 0 6px;
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.65rem;
  color: #b45309;
  background: color-mix(in srgb, #d97706 14%, transparent);
}
.dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
}
.dot.activo {
  background: #2563eb;
  box-shadow: 0 0 0 3px color-mix(in srgb, #2563eb 25%, transparent);
}
.fila.activa {
  background: var(--surface, #fff);
  outline: 2px solid #2563eb;
  outline-offset: -2px;
  border-radius: 10px;
}
.cuenta {
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  color: #2563eb;
  background: color-mix(in srgb, #2563eb 10%, transparent);
  border: 1px solid color-mix(in srgb, #2563eb 25%, transparent);
}
.vacio {
  margin: 0;
  font-size: 0.85rem;
  color: var(--on-surface-variant);
}
.lista {
  list-style: none;
  margin: 0;
  padding: 0;
  border-radius: 12px;
  background: var(--surface-low);
  border: 1px solid var(--outline-variant, rgba(100, 116, 139, 0.25));
}
.fila {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
  padding: 4px 8px 4px 14px;
  gap: 4px 10px;
}
.fila + .fila {
  border-top: 1px solid var(--outline-variant, rgba(100, 116, 139, 0.2));
}
.nombre {
  flex: 1;
  min-width: 0;
  font-size: 0.85rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.edicion {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 4px;
  min-width: 0;
}
.error {
  flex-basis: 100%;
  color: var(--error);
}
</style>
