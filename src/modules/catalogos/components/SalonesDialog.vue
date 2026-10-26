<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Textarea from 'primevue/textarea'
import { aviso } from '@/core/http/avisos'
import { aMapa, mensajeError } from '@/core/http/errores'
import { LIMITES, limpiarEspacios, sinControl } from '@/core/utils/validacion'
import { agregarSalones, renombrarSalon } from '../api/catalogos.api'
import type { Edificio } from '../types/catalogo.types'
import { validarSalones } from '../utils/validarCatalogo'

/**
 * Salones de un edificio: se agregan varios a la vez (uno por línea) y se renombran de uno en uno.
 * Cada cambio se guarda al momento (el backend devuelve el edificio ya actualizado).
 */
const props = defineProps<{ elemento: Edificio }>()
const emit = defineEmits<{ cerrar: []; actualizar: [] }>()

const abierto = ref(true)
const salones = ref<string[]>([...props.elemento.salones])
const trabajando = ref(false)
const limpio = (t: string) => limpiarEspacios(sinControl(t))

// ── agregar ──
const nuevos = ref('')
const errorNuevos = ref('')
const lista = computed(() => nuevos.value.split('\n').map(limpio).filter(Boolean))

// ── renombrar ──
const editando = ref<string | null>(null)
const nombre = ref('')
const errorNombre = ref('')

function aplicar(r: Edificio | null | undefined, respaldo: string[]) {
  salones.value = r && Array.isArray(r.salones) ? [...r.salones] : respaldo
  emit('actualizar')
}

async function agregar() {
  if (trabajando.value) return
  errorNuevos.value = ''
  if (!lista.value.length) {
    errorNuevos.value = 'Escribe al menos un salón.'
    return
  }
  const problema = validarSalones(lista.value, salones.value)
  if (problema) {
    errorNuevos.value = problema
    return
  }
  trabajando.value = true
  try {
    const r = await agregarSalones(props.elemento.clave, lista.value)
    const n = lista.value.length
    aplicar(r, [...salones.value, ...lista.value])
    nuevos.value = ''
    aviso('success', n === 1 ? 'Salón agregado' : 'Salones agregados', props.elemento.edificio)
  } catch (e) {
    const m = aMapa(e)
    errorNuevos.value = m.salones || m.salon || mensajeError(e)
  } finally {
    trabajando.value = false
  }
}

async function empezar(s: string) {
  editando.value = s
  nombre.value = s
  errorNombre.value = ''
  await nextTick()
  document.querySelector<HTMLInputElement>('#sal-renombrar')?.focus()
}
const cancelar = () => {
  editando.value = null
  errorNombre.value = ''
}

async function guardarNombre() {
  const actual = editando.value
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
    const r = await renombrarSalon(props.elemento.clave, actual, nuevo)
    aplicar(r, salones.value.map((x) => (x === actual ? nuevo : x)))
    editando.value = null
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
  <Dialog
    v-model:visible="abierto"
    :header="`Salones de ${elemento.edificio}`"
    modal
    :draggable="false"
    :closable="!trabajando"
    :close-on-escape="!trabajando"
    :style="{ width: '36rem' }"
    :breakpoints="{ '640px': '96vw' }"
    @after-hide="emit('cerrar')"
  >
    <p class="contexto">Clave: {{ elemento.clave }} · {{ salones.length }} {{ salones.length === 1 ? 'salón' : 'salones' }}</p>

    <p v-if="!salones.length" class="vacio">Este edificio aún no tiene salones.</p>
    <ul v-else class="lista">
      <li v-for="s in salones" :key="s" class="fila">
        <template v-if="editando === s">
          <form class="edicion" novalidate @submit.prevent="guardarNombre">
            <InputText id="sal-renombrar" v-model="nombre" :maxlength="LIMITES.textoCatalogo.max" :invalid="!!errorNombre" :disabled="trabajando" aria-label="Nuevo nombre del salón" fluid />
            <Button type="submit" icon="pi pi-check" size="small" rounded text :loading="trabajando" aria-label="Guardar nombre" data-accion="guardar-salon" />
            <Button type="button" icon="pi pi-times" size="small" rounded text severity="secondary" :disabled="trabajando" aria-label="Cancelar" @click="cancelar" />
          </form>
          <small v-if="errorNombre" class="error">{{ errorNombre }}</small>
        </template>
        <template v-else>
          <span class="nombre una-linea" :title="s">{{ s }}</span>
          <Button icon="pi pi-pencil" size="small" rounded text severity="secondary" :aria-label="`Renombrar ${s}`" :disabled="trabajando" data-accion="renombrar-salon" @click="empezar(s)" />
        </template>
      </li>
    </ul>

    <form class="agregar" novalidate @submit.prevent="agregar">
      <label for="sal-nuevos">Agregar salones <small>(uno por línea)</small></label>
      <Textarea id="sal-nuevos" v-model="nuevos" rows="3" placeholder="Aula 111&#10;Aula 112" :invalid="!!errorNuevos" :disabled="trabajando" fluid />
      <Message v-if="errorNuevos" severity="error" :closable="false" size="small">{{ errorNuevos }}</Message>
      <div class="botones">
        <Button type="submit" label="Agregar" icon="pi pi-plus" :loading="trabajando" :disabled="!lista.length" data-accion="agregar-salones" />
      </div>
    </form>

    <template #footer>
      <Button label="Cerrar" severity="secondary" text :disabled="trabajando" @click="abierto = false" />
    </template>
  </Dialog>
</template>

<style scoped>
.contexto {
  margin: 0 0 12px;
  color: var(--on-surface-variant);
  font-size: 0.85rem;
}
.vacio {
  margin: 0 0 12px;
  color: var(--on-surface-variant);
}
.lista {
  list-style: none;
  margin: 0 0 16px;
  padding: 0;
  max-height: 16rem;
  overflow-y: auto;
  border: 1px solid var(--outline-variant);
  border-radius: 10px;
}
.fila {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
  padding: 6px 10px;
}
.fila + .fila {
  border-top: 1px solid var(--outline-variant);
}
.nombre {
  flex: 1;
  min-width: 0;
  font-weight: 500;
}
.una-linea {
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
.agregar {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.agregar label {
  font-weight: 600;
  font-size: 0.85rem;
}
.agregar label small {
  font-weight: 400;
  color: var(--on-surface-variant);
}
.botones {
  display: flex;
  justify-content: flex-end;
}
</style>
