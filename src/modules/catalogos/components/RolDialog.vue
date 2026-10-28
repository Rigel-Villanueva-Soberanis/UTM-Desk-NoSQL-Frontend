<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import { primerError } from '@/core/http/errores'
import { LIMITES, limpiarEspacios, sinControl } from '@/core/utils/validacion'
import PaginadorMini from '@/shared/components/PaginadorMini.vue'
import { useAccion } from '@/shared/composables/useAccion'
import { editarElemento } from '../api/catalogos.api'
import type { RolCatalogo } from '../types/catalogo.types'
import { validarClasificaciones } from '../utils/validarCatalogo'
import EditorSalones from './EditorSalones.vue'
import ModalCatalogo from './ModalCatalogo.vue'

/**
 * Clasificaciones de un rol. Dos usos:
 *  · `soloAgregar` (el «+» de su fila) → solo suma clasificaciones nuevas;
 *  · sin `soloAgregar` (el lápiz)      → edita o quita las que ya tiene.
 */
const props = defineProps<{ elemento: RolCatalogo; soloAgregar?: boolean }>()
const emit = defineEmits<{ cerrar: []; actualizar: [] }>()

const POR_PAGINA = 6
const { abierto, enviando, errores, mensaje, limpiar, ejecutar } = useAccion(() => emit('actualizar'))
const limpio = (t: string) => limpiarEspacios(sinControl(t))
const yaTiene = computed(() => props.elemento.clasificaciones_permitidas)
const obligatoria = computed(() => props.elemento.requiere_clasificacion)

const nuevas = ref<string[]>([]) // modo agregar
const lista = ref<string[]>([...props.elemento.clasificaciones_permitidas]) // modo editar
const pagina = ref(1)
watch(nuevas, () => limpiar('clasificaciones_permitidas'), { deep: true })
watch(lista, () => limpiar('clasificaciones_permitidas'), { deep: true })

const visibles = computed(() => lista.value.map((valor, i) => ({ valor, i })).slice((pagina.value - 1) * POR_PAGINA, pagina.value * POR_PAGINA))
const quitar = (i: number) => lista.value.splice(i, 1)

const sinCambios = computed(() =>
  props.soloAgregar ? !nuevas.value.length : JSON.stringify(lista.value.map(limpio)) === JSON.stringify(yaTiene.value),
)

/** Validación de un valor nuevo contra lo que ya hay. */
const validarNueva = (v: string, previos: string[]) => validarClasificaciones([...previos, v], false)

function guardar() {
  const final = props.soloAgregar ? [...yaTiene.value, ...nuevas.value] : lista.value.map(limpio)
  return ejecutar({
    campos: ['clasificaciones_permitidas'],
    validar: () => {
      const e = validarClasificaciones(final, obligatoria.value)
      // Al editar, la página salta a la primera clasificación con problema (vacía o repetida).
      if (e && !props.soloAgregar) {
        const vacia = lista.value.findIndex((x) => !limpio(x))
        if (vacia >= 0) pagina.value = Math.floor(vacia / POR_PAGINA) + 1
      }
      return { clasificaciones_permitidas: e }
    },
    enviar: () => editarElemento('roles_sistema', props.elemento.rol, { clasificaciones_permitidas: final }),
    exito: () => ({ titulo: props.soloAgregar ? 'Clasificaciones agregadas' : 'Clasificaciones actualizadas', detalle: props.elemento.rol }),
  })
}

const estado = computed(() =>
  props.soloAgregar
    ? nuevas.value.length ? `${nuevas.value.length} ${nuevas.value.length === 1 ? 'clasificación por agregar' : 'clasificaciones por agregar'}` : 'Aún no hay clasificaciones por agregar'
    : sinCambios.value ? 'Sin cambios pendientes' : 'Listo para guardar',
)
</script>

<template>
  <ModalCatalogo
    v-model:visible="abierto"
    :titulo="soloAgregar ? `Agregar clasificaciones a «${elemento.rol}»` : `Clasificaciones de «${elemento.rol}»`"
    :descripcion="soloAgregar ? 'Suma especialidades o subcategorías permitidas para este rol institucional.' : 'Edita o quita las especialidades o subcategorías permitidas para este rol institucional.'"
    icono="pi pi-shield"
    :etiqueta-guardar="soloAgregar ? (nuevas.length > 1 ? `Agregar ${nuevas.length} clasificaciones` : 'Agregar clasificación') : 'Guardar clasificaciones'"
    :sin-cambios="sinCambios"
    :enviando="enviando"
    :mensaje="mensaje"
    :estado="estado"
    :estado-ok="!sinCambios"
    @guardar="guardar"
    @cerrado="emit('cerrar')"
  >
    <template #titulo-extra>
      <span class="clave-fija">roles_sistema</span>
    </template>

    <div class="banner">
      <i class="pi pi-info-circle" />
      <div>
        <p class="b-titulo">
          {{ obligatoria ? 'Clasificación obligatoria para este rol' : 'Clasificación opcional para este rol' }}
          <span class="b-chip" :class="{ oblig: obligatoria }">{{ obligatoria ? 'Obligatorio' : 'No obligatorio' }}</span>
        </p>
        <p class="b-texto">
          {{ obligatoria
            ? `Al crear un usuario con rol ${elemento.rol} se debe elegir una de estas clasificaciones.`
            : `Este rol no requiere clasificación. Los usuarios con rol ${elemento.rol} pueden operar sin subclasificación o adoptar las configuradas.` }}
        </p>
      </div>
    </div>

    <!-- Agregar: solo clasificaciones nuevas -->
    <template v-if="soloAgregar">
      <EditorSalones
        v-model="nuevas"
        :ya="yaTiene"
        :error="primerError(errores, 'clasificaciones_permitidas')"
        :disabled="enviando"
        :opcional="false"
        etiqueta="Nuevas clasificaciones"
        placeholder="Ej. Auditor de Sistemas, Admin Red…"
        :textos="{ uno: 'por agregar', varios: 'por agregar', vacio: `${yaTiene.length} configuradas` }"
        text-vacio="Las clasificaciones que agregues aparecerán aquí."
        texto-listo="Se sumarán a las que ya tiene el rol"
        :validar="validarNueva"
      />
      <p v-if="yaTiene.length" class="actuales">Ya configuradas: {{ yaTiene.join(', ') }}</p>
    </template>

    <!-- Editar: las que ya existen -->
    <section v-else class="existentes">
      <div class="titulo">
        <span class="t">Clasificaciones activas para este rol</span>
        <span class="cuenta">{{ lista.length }} {{ lista.length === 1 ? 'configurada' : 'configuradas' }}</span>
      </div>
      <p v-if="!lista.length" class="vacio">Este rol no tiene clasificaciones. Agrégalas con el «+» de su fila.</p>
      <ul v-else class="lista" :class="{ invalido: !!errores.clasificaciones_permitidas }">
        <li v-for="{ valor, i } in visibles" :key="i" class="fila">
          <span class="dot" />
          <InputText v-model="lista[i]" :maxlength="LIMITES.textoCatalogo.max" :aria-label="`Clasificación ${i + 1}`" autocomplete="off" :invalid="!limpio(valor)" :disabled="enviando" fluid @keydown.enter.prevent />
          <Button type="button" icon="pi pi-trash" text rounded size="small" severity="danger" :aria-label="`Quitar ${valor}`" title="Quitar clasificación" :disabled="enviando" @click="quitar(i)" />
        </li>
      </ul>
      <PaginadorMini v-model="pagina" :total="lista.length" :tamano="POR_PAGINA" />
      <small v-if="errores.clasificaciones_permitidas" class="error">{{ errores.clasificaciones_permitidas }}</small>
    </section>
  </ModalCatalogo>
</template>

<style scoped>
.clave-fija {
  padding: 2px 10px;
  border-radius: 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.72rem;
  font-weight: 600;
  background: var(--surface-low);
  border: 1px solid var(--outline-variant, rgba(100, 116, 139, 0.3));
}
.banner {
  display: flex;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  background: color-mix(in srgb, #2563eb 7%, transparent);
  border: 1px solid color-mix(in srgb, #2563eb 18%, transparent);
}
.banner > i {
  margin-top: 2px;
  color: #2563eb;
}
.banner p {
  margin: 0;
}
.b-titulo {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  font-weight: 600;
}
.b-chip {
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 0.68rem;
  font-weight: 600;
  color: #047857;
  background: color-mix(in srgb, #10b981 15%, transparent);
}
.b-chip.oblig {
  color: #b45309;
  background: color-mix(in srgb, #d97706 15%, transparent);
}
.b-texto {
  margin-top: 2px;
  font-size: 0.78rem;
  line-height: 1.45;
  color: var(--on-surface-variant);
}
.actuales {
  margin: -6px 0 0;
  font-size: 0.78rem;
  color: var(--on-surface-variant);
  overflow-wrap: anywhere;
}
.existentes {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.titulo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.t {
  font-weight: 700;
  font-size: 0.9rem;
}
.cuenta {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--on-surface-variant);
}
.vacio {
  margin: 0;
  font-size: 0.85rem;
  color: var(--on-surface-variant);
}
.lista {
  list-style: none;
  margin: 0;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-radius: 12px;
  background: var(--surface-low);
  border: 1px solid var(--outline-variant, rgba(100, 116, 139, 0.25));
}
.fila {
  display: flex;
  align-items: center;
  gap: 10px;
}
.dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2563eb;
}
.error {
  color: var(--error);
}
</style>
