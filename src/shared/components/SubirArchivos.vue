<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import {
  ACCEPT,
  MAX_ARCHIVOS,
  MAX_MB,
  esImagen,
  formatearBytes,
  validarArchivo,
} from '@/core/utils/archivos'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { useConfirmarEliminacion } from '../composables/useConfirmarEliminacion'
import CampoError from './CampoError.vue'

const props = withDefaults(
  defineProps<{
    max?: number
    maxMb?: number
    disabled?: boolean
    /** Error que viene de fuera (p. ej. del backend). */
    error?: string
  }>(),
  { max: MAX_ARCHIVOS, maxMb: MAX_MB, disabled: false, error: '' },
)

const archivos = defineModel<File[]>({ default: () => [] })

const entrada = ref<HTMLInputElement | null>(null)
const arrastrando = ref(false)
const errorLocal = ref('')
const urls = new Map<File, string>()
const { confirmar } = useConfirmarEliminacion()
const viendo = ref<File | null>(null)
const visible = computed({
  get: () => viendo.value !== null,
  set: (v) => { if (!v) viendo.value = null },
})
function pedirEliminar(a: File) {
  confirmar({
    que: `${esImagen(a.name) ? 'la imagen' : 'el archivo'} «${a.name}»`,
    alAceptar: () => {
      if (viendo.value === a) viendo.value = null
      quitar(a)
    },
  })
}
const eliminarDelVisor = () => viendo.value && pedirEliminar(viendo.value)
const verPdf = (a: File) => window.open(vistaPrevia(a), '_blank', 'noopener')

const lleno = computed(() => archivos.value.length >= props.max)
const mensaje = computed(() => errorLocal.value || props.error)

function abrir() {
  if (!props.disabled && !lleno.value) entrada.value?.click()
}

function agregar(lista: FileList | File[]) {
  const nuevos = Array.from(lista)
  const problemas: string[] = []
  const aceptados: File[] = []

  for (const f of nuevos) {
    const motivo = validarArchivo(f, props.maxMb * 1024 * 1024)
    if (motivo) problemas.push(motivo)
    else if (archivos.value.some((a) => a.name === f.name && a.size === f.size)) continue // repetido
    else if (archivos.value.length + aceptados.length >= props.max)
      problemas.push(`"${f.name}": máximo ${props.max} archivos por reporte.`)
    else aceptados.push(f)
  }

  errorLocal.value = problemas.join(' ')
  if (aceptados.length) archivos.value = [...archivos.value, ...aceptados]
}

function alElegir(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files) agregar(input.files)
  input.value = '' // permite volver a elegir el mismo archivo
}

function alSoltar(e: DragEvent) {
  arrastrando.value = false
  if (props.disabled || !e.dataTransfer) return
  agregar(e.dataTransfer.files)
}

function quitar(archivo: File) {
  const url = urls.get(archivo)
  if (url) URL.revokeObjectURL(url)
  urls.delete(archivo)
  archivos.value = archivos.value.filter((a) => a !== archivo)
  errorLocal.value = ''
}

function vistaPrevia(archivo: File): string {
  let url = urls.get(archivo)
  if (!url) {
    url = URL.createObjectURL(archivo)
    urls.set(archivo, url)
  }
  return url
}

onBeforeUnmount(() => urls.forEach((u) => URL.revokeObjectURL(u)))
</script>

<template>
  <div class="subir" :class="{ invalido: !!mensaje }">
    <div
      class="zona"
      :class="{ arrastrando, bloqueada: disabled || lleno }"
      role="button"
      :tabindex="disabled || lleno ? -1 : 0"
      :aria-disabled="disabled || lleno"
      aria-label="Adjuntar archivos"
      @click="abrir"
      @keydown.enter.prevent="abrir"
      @keydown.space.prevent="abrir"
      @dragover.prevent="arrastrando = !disabled"
      @dragleave.prevent="arrastrando = false"
      @drop.prevent="alSoltar"
    >
      <i class="pi pi-cloud-upload" />
      <p class="principal">
        <template v-if="lleno">Llegaste al máximo de {{ max }} archivos</template>
        <template v-else>Arrastra archivos aquí o <u>elígelos</u></template>
      </p>
      <p class="ayuda">
        Hasta {{ max }} archivos · {{ maxMb }} MB c/u · JPG, PNG, WEBP o PDF
      </p>
      <input
        ref="entrada"
        type="file"
        class="oculto"
        multiple
        :accept="ACCEPT"
        :disabled="disabled || lleno"
        tabindex="-1"
        @change="alElegir"
      />
    </div>

    <ul v-if="archivos.length" class="lista">
      <li v-for="a in archivos" :key="a.name + a.size" class="item">
        <button v-if="esImagen(a.name)" type="button" class="ver-mini" :aria-label="`Ver ${a.name}`" @click="viendo = a">
          <img :src="vistaPrevia(a)" :alt="a.name" class="mini" />
        </button>
        <span v-else class="mini pdf"><i class="pi pi-file-pdf" /></span>
        <span class="nombre" :title="a.name">{{ a.name }}</span>
        <span class="peso">{{ formatearBytes(a.size) }}</span>
        <button type="button" class="quitar ojo" :aria-label="`Ver ${a.name}`" title="Ver" @click="esImagen(a.name) ? (viendo = a) : verPdf(a)">
          <i class="pi pi-eye" />
        </button>
        <button
          type="button"
          class="quitar"
          :disabled="disabled"
          :aria-label="`Quitar ${a.name}`"
          @click="pedirEliminar(a)"
        >
          <i class="pi pi-times" />
        </button>
      </li>
    </ul>

    <CampoError :mensaje="mensaje" />

    <Dialog v-model:visible="visible" modal dismissableMask :content-style="{ overflow: 'hidden' }" :header="viendo?.name" :style="{ width: 'min(92vw, 900px)' }">
      <img v-if="viendo" :src="vistaPrevia(viendo)" :alt="viendo.name" class="grande" :style="{ display: 'block', maxWidth: '100%', maxHeight: '75vh', width: 'auto', height: 'auto', margin: '0 auto', objectFit: 'contain' }" />
      <template #footer>
        <Button label="Cancelar" severity="secondary" text data-accion="visor-cancelar" @click="viendo = null" />
        <Button label="Eliminar" icon="pi pi-trash" severity="danger" data-accion="visor-eliminar" @click="eliminarDelVisor" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
/* Ancho: si el contenedor de arriba declara `container-type`, la zona ocupa 2/3 y la lista 1/3 (cuando hay archivos). */
.subir {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
  align-items: stretch;
}
.subir > :deep(*:last-child:not(.zona):not(.lista)) {
  grid-column: 1 / -1;
}
@container (min-width: 640px) {
  .subir:has(.lista) {
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  }
}
.zona {
  justify-content: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 24px 16px;
  text-align: center;
  background: var(--surface-low);
  border: 1.5px dashed var(--outline-variant);
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.zona:hover:not(.bloqueada),
.zona.arrastrando {
  border-color: var(--accent-soft);
  background: var(--surface-container);
}
.zona:focus-visible {
  outline: 2px solid var(--accent-soft);
  outline-offset: 2px;
}
.zona.bloqueada {
  cursor: not-allowed;
  opacity: 0.6;
}
.zona .pi {
  font-size: 1.75rem;
  color: var(--tint);
}
.principal {
  font-weight: 500;
}
.ayuda {
  font-size: 0.8rem;
  color: var(--on-surface-variant);
}
.invalido .zona {
  border-color: var(--error);
}
.oculto {
  display: none;
}
.lista {
  list-style: none;
  margin: 0;
  align-self: start;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: var(--card);
  border: 1px solid var(--outline-variant);
  border-radius: 10px;
}
.mini {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  object-fit: cover;
  border-radius: 6px;
}
.mini.pdf {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--error-container);
  color: var(--on-error-container);
  font-size: 1.25rem;
}
.nombre {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}
.peso {
  color: var(--on-surface-variant);
  font-size: 0.8rem;
}
.quitar {
  display: flex;
  padding: 6px;
  border: 0;
  border-radius: 6px;
  background: none;
  color: var(--on-surface-variant);
  cursor: pointer;
}
.ver-mini {
  display: flex;
  padding: 0;
  border: 0;
  background: none;
  cursor: zoom-in;
}
.grande {
  display: block;
  max-width: 100%;
  max-height: 75vh;
  margin: 0 auto;
  object-fit: contain;
}
.quitar.ojo:hover {
  background: var(--surface-container);
  color: var(--accent-soft);
}
.quitar:hover:not(:disabled) {
  background: var(--error-container);
  color: var(--on-error-container);
}
</style>
