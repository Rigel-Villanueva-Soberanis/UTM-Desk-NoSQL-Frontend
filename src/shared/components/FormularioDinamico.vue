<script setup lang="ts">
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import type { CampoDinamico } from '@/modules/catalogos/types/catalogo.types'
import { LIMITES } from '@/core/utils/validacion'
import CampoError from './CampoError.vue'

const props = withDefaults(
  defineProps<{
    /** `campos_dinamicos` de la categoría elegida. */
    campos: CampoDinamico[]
    /** Errores del backend/cliente; la clave es la ruta: `detalleEspecifico.<clave>`. */
    errores?: Record<string, string>
    prefijo?: string
    disabled?: boolean
  }>(),
  { errores: () => ({}), prefijo: 'detalleEspecifico', disabled: false },
)

/** Objeto `detalleEspecifico`: solo trae los campos que tienen valor. */
const modelo = defineModel<Record<string, string | number>>({ required: true })

function poner(clave: string, valor: string | number | null | undefined) {
  const copia = { ...modelo.value }
  if (valor === null || valor === undefined || valor === '') delete copia[clave]
  else copia[clave] = valor
  modelo.value = copia
}

const errorDe = (clave: string) => props.errores[`${props.prefijo}.${clave}`]
const numero = (clave: string) => {
  const v = modelo.value[clave]
  return typeof v === 'number' ? v : null
}
const texto = (clave: string) => {
  const v = modelo.value[clave]
  return v === undefined ? '' : String(v)
}
</script>

<template>
  <div class="dinamico">
    <div v-for="c in campos" :key="c.clave" class="campo" :class="{ invalido: !!errorDe(c.clave) }">
      <label :for="`fd-${c.clave}`">
        {{ c.etiqueta }}<span v-if="c.requerido" class="req" aria-hidden="true"> *</span>
      </label>

      <InputText
        v-if="c.tipo_input === 'text'"
        :id="`fd-${c.clave}`"
        :model-value="texto(c.clave)"
        :maxlength="LIMITES.campoDinamico.max"
        :invalid="!!errorDe(c.clave)"
        :disabled="disabled"
        fluid
        @update:model-value="(v) => poner(c.clave, v?.toString())"
      />

      <InputNumber
        v-else-if="c.tipo_input === 'number'"
        :input-id="`fd-${c.clave}`"
        :model-value="numero(c.clave)"
        :invalid="!!errorDe(c.clave)"
        :disabled="disabled"
        :use-grouping="false"
        :max-fraction-digits="2"
        :min="-999999999"
        :max="999999999"
        fluid
        @update:model-value="(v) => poner(c.clave, v)"
      />

      <Select
        v-else-if="c.tipo_input === 'select'"
        :input-id="`fd-${c.clave}`"
        :model-value="modelo[c.clave] ?? null"
        :options="c.opciones ?? []"
        :invalid="!!errorDe(c.clave)"
        :disabled="disabled"
        placeholder="Selecciona una opción"
        fluid
        @update:model-value="(v) => poner(c.clave, v)"
      />

      <CampoError :mensaje="errorDe(c.clave)" />
    </div>
  </div>
</template>

<style scoped>
.dinamico {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}
.campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
label {
  font-weight: 600;
  overflow-wrap: anywhere;
}
.campo {
  min-width: 0;
}
.req {
  color: var(--error);
}
</style>
