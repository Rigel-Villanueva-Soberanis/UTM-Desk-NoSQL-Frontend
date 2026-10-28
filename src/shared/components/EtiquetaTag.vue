<script setup lang="ts">
/**
 * Etiqueta con el diseño único de la app (mismos colores que en el expediente: el color depende del texto).
 * Con `accion` es un botón (p. ej. «quitar» con ✕); sin ella, un simple rótulo.
 */
import { computed } from 'vue'
import { colorEtiqueta } from '@/core/utils/etiquetas'

const props = defineProps<{
  texto: string
  /** Icono del botón de la derecha (p. ej. `pi-times`). Si se indica, la etiqueta es un botón. */
  accion?: string
  titulo?: string
  /** Marcada para quitarse: tachada y en rojo. */
  marcada?: boolean
  disabled?: boolean
}>()
const emit = defineEmits<{ click: [] }>()
const color = computed(() => colorEtiqueta(props.texto))
</script>

<template>
  <component
    :is="accion ? 'button' : 'span'"
    :type="accion ? 'button' : undefined"
    class="tag"
    :class="[color, { marcada, boton: !!accion }]"
    :title="titulo ?? texto"
    :disabled="accion ? disabled : undefined"
    @click="accion && emit('click')"
  >
    <i class="pi pi-tag" aria-hidden="true" />
    <span class="texto">{{ texto }}</span>
    <i v-if="accion" :class="['pi', 'accion', accion]" aria-hidden="true" />
  </component>
</template>

<style scoped>
.tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  padding: 4px 12px;
  border: 1px solid;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.4;
  overflow-wrap: anywhere;
}
.tag .pi {
  font-size: 0.65rem;
}
.tag .accion {
  margin-left: 2px;
  opacity: 0.7;
}
.tag.boton {
  cursor: pointer;
  transition: box-shadow 0.15s;
}
.tag.boton:hover:not(:disabled) {
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.18);
}
.tag.azul { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; }
.tag.ambar { background: #fffbeb; border-color: #fde68a; color: #92400e; }
.tag.morado { background: #faf5ff; border-color: #e9d5ff; color: #7e22ce; }
.tag.verde { background: #ecfdf5; border-color: #a7f3d0; color: #047857; }
.tag.cian { background: #ecfeff; border-color: #a5f3fc; color: #0e7490; }
.tag.rosa { background: #fff1f2; border-color: #fecdd3; color: #be123c; }
.tag.marcada {
  border-style: dashed;
  background: #fef2f2;
  border-color: #fca5a5;
  color: #b91c1c;
}
.tag.marcada .texto {
  text-decoration: line-through;
}
</style>
