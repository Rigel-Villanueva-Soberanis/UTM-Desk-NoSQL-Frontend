<script setup lang="ts">
import { computed, ref } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import { LIMITES, limpiarEspacios, sinControl } from '@/core/utils/validacion'
import CampoError from '@/shared/components/CampoError.vue'
import { validarSalones } from '../utils/validarCatalogo'

/**
 * Lista de salones por agregar: se escribe el nombre y se pulsa «Agregar» (o Enter); cada salón queda como
 * una etiqueta que se puede quitar. `ya` = los salones que el edificio ya tiene (para no repetirlos).
 */
interface Textos {
  uno: string
  varios: string
  vacio: string
}
const props = withDefaults(
  defineProps<{
    ya?: string[]
    error?: string
    disabled?: boolean
    etiqueta?: string
    opcional?: boolean
    placeholder?: string
    textos?: Textos
    textoVacio?: string
    textoListo?: string
    /** Mensaje de error para un valor nuevo (vacío = válido). `previos` = los que ya hay. */
    validar?: (valor: string, previos: string[]) => string
  }>(),
  {
    ya: () => [],
    error: '',
    disabled: false,
    etiqueta: 'Salones y espacios asociados',
    opcional: true,
    placeholder: 'Nombre del salón (ej. Aula 3, Lab Cómputo 2)',
    textos: () => ({ uno: 'salón agregado', varios: 'salones agregados', vacio: 'Sin salones aún' }),
    textoVacio: 'Los salones que agregues aparecerán aquí.',
    textoListo: 'Espacios listos para ser vinculados',
    validar: (v: string, previos: string[]) => validarSalones([v], previos),
  },
)
const lista = defineModel<string[]>({ required: true })
const emit = defineEmits<{ cambio: [] }>()

const entrada = ref('')
const errorLocal = ref('')
const campo = ref<InstanceType<typeof InputText> | null>(null)
const mostrado = computed(() => errorLocal.value || props.error)
const resumen = computed(() => (lista.value.length === 0 ? props.textos.vacio : `${lista.value.length} ${lista.value.length === 1 ? props.textos.uno : props.textos.varios}`))

function agregar() {
  const valor = limpiarEspacios(sinControl(entrada.value))
  if (!valor) {
    errorLocal.value = ''
    return
  }
  const problema = props.validar(valor, [...props.ya, ...lista.value])
  if (problema) {
    errorLocal.value = problema
    return
  }
  errorLocal.value = ''
  lista.value = [...lista.value, valor]
  entrada.value = ''
  emit('cambio')
  ;(campo.value?.$el as HTMLInputElement | undefined)?.focus()
}
function quitar(s: string) {
  lista.value = lista.value.filter((x) => x !== s)
  emit('cambio')
}
function limpiarTodos() {
  lista.value = []
  emit('cambio')
}
</script>

<template>
  <div class="editor">
    <div class="titulo">
      <label for="es-entrada">{{ etiqueta }} <small v-if="opcional">(opcional)</small></label>
      <span class="badge"><span class="punto" />{{ resumen }}</span>
    </div>

    <div class="fila">
      <InputText
        id="es-entrada"
        ref="campo"
        v-model="entrada"
        :maxlength="LIMITES.textoCatalogo.max"
        :placeholder="placeholder"
        :invalid="!!mostrado"
        :disabled="disabled"
        autocomplete="off"
        fluid
        @keydown.enter.prevent="agregar"
        @input="errorLocal = ''"
      />
      <Button type="button" label="Agregar" icon="pi pi-plus" :disabled="disabled || !entrada.trim()" data-accion="agregar-a-lista" @click="agregar" />
    </div>
    <CampoError :mensaje="mostrado" />
    <small class="ayuda">Escribe el nombre y pulsa <strong>Agregar</strong> o <strong>Enter</strong>. Podrás añadir más en cualquier momento.</small>

    <div class="caja">
      <p v-if="!lista.length" class="vacio">{{ textoVacio }}</p>
      <div v-else class="chips">
        <span v-for="s in lista" :key="s" class="chip">
          <span class="chip-punto" />
          <span class="chip-texto" :title="s">{{ s }}</span>
          <button type="button" class="quitar" :disabled="disabled" :aria-label="`Quitar ${s}`" :title="`Quitar ${s}`" @click="quitar(s)"><i class="pi pi-times" /></button>
        </span>
      </div>
      <div v-if="lista.length" class="caja-pie">
        <span class="listo"><i class="pi pi-check" /> {{ textoListo }}</span>
        <button type="button" class="limpiar" :disabled="disabled" @click="limpiarTodos">Limpiar todos</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor {
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
  gap: 8px;
  flex-wrap: wrap;
}
label {
  font-weight: 600;
  font-size: 0.85rem;
}
label small {
  font-weight: 400;
  color: var(--on-surface-variant);
}
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #2563eb;
  background: color-mix(in srgb, #2563eb 10%, transparent);
  border: 1px solid color-mix(in srgb, #2563eb 25%, transparent);
}
.punto {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #2563eb;
}
.fila {
  display: flex;
  gap: 8px;
  align-items: stretch;
}
.fila > :first-child {
  flex: 1;
  min-width: 0;
}
.ayuda {
  color: var(--on-surface-variant);
  font-size: 0.75rem;
}
.caja {
  margin-top: 4px;
  padding: 12px;
  min-height: 5.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 10px;
  border-radius: 12px;
  background: var(--surface-low);
  border: 1px solid var(--outline-variant, rgba(100, 116, 139, 0.25));
}
.vacio {
  margin: auto;
  font-size: 0.85rem;
  color: var(--on-surface-variant);
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 9rem;
  overflow-y: auto;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 100%;
  padding: 5px 8px 5px 12px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 500;
  background: var(--surface, #fff);
  border: 1px solid var(--outline-variant, rgba(100, 116, 139, 0.3));
}
.chip-punto {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  flex-shrink: 0;
}
.chip-texto {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.quitar {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--on-surface-variant);
  cursor: pointer;
  font-size: 0.65rem;
}
.quitar:hover:not(:disabled) {
  color: #e11d48;
  background: color-mix(in srgb, #e11d48 10%, transparent);
}
.caja-pie {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--outline-variant, rgba(100, 116, 139, 0.2));
  font-size: 0.75rem;
}
.listo {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  color: #047857;
}
.limpiar {
  border: 0;
  background: transparent;
  color: var(--on-surface-variant);
  font-size: 0.75rem;
  cursor: pointer;
}
.limpiar:hover:not(:disabled) {
  color: #e11d48;
  text-decoration: underline;
}
</style>
