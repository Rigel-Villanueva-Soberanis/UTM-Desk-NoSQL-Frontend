<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { usePermisos } from '@/core/auth/usePermisos'
import { MENU } from './menu'
import { refrescarContadores, useContadores } from './useContadores'

defineProps<{ colapsado?: boolean }>()
const emit = defineEmits<{ navegar: [] }>()

const router = useRouter()
const route = useRoute()
const { puede, rol } = usePermisos()
const { total, sinAsignar } = useContadores()

// Solo se muestran opciones con permiso Y con ruta ya construida.
const opciones = computed(() => {
  const existentes = new Set(router.getRoutes().map((r) => r.path))
  return MENU.filter((o) => puede(o.permiso) && existentes.has(o.ruta)).map((o) => ({
    ...o,
    texto: (rol.value && o.textoPorRol?.[rol.value]) || o.texto,
  }))
})
/** «Reportar falla» es el botón destacado; el resto es la lista. */
const principal = computed(() => opciones.value.find((o) => o.ruta === '/incidencias/nueva'))
const lista = computed(() => opciones.value.filter((o) => o.ruta !== '/incidencias/nueva'))

/** Activa: la ruta exacta o una hija (el expediente cuelga de Incidencias), la más específica gana. */
function esActiva(ruta: string) {
  const p = route.path
  const coincide = (r: string) => p === r || p.startsWith(r + '/')
  if (!coincide(ruta)) return false
  if (ruta === '/incidencias' && p === '/incidencias/nueva') return false
  return !opciones.value.some((o) => o.ruta.length > ruta.length && coincide(o.ruta))
}

const esDestacadaActiva = computed(() => route.path === '/incidencias/nueva')

const insignia = (ruta: string): { n: number; clase: string } | null => {
  const n = ruta === '/incidencias' ? total.value : ruta === '/bandeja' ? sinAsignar.value : null
  return n === null || n === undefined ? null : { n, clase: ruta === '/bandeja' ? 'ambar' : 'azul' }
}

const cuales = () => ({
  total: lista.value.some((o) => o.ruta === '/incidencias'),
  sinAsignar: lista.value.some((o) => o.ruta === '/bandeja'),
})
// Se actualizan al entrar y al cambiar de pantalla (con espera mínima de 10 s) y al volver a la pestaña.
const alVolver = () => void refrescarContadores(cuales(), true)
onMounted(() => {
  void refrescarContadores(cuales(), true)
  window.addEventListener('focus', alVolver)
})
onBeforeUnmount(() => window.removeEventListener('focus', alVolver))
watch(() => route.path, () => void refrescarContadores(cuales()))
</script>

<template>
  <nav class="menu" aria-label="Menú principal">
    <RouterLink v-if="principal" :to="principal.ruta" class="destacado" :class="{ activa: esDestacadaActiva }" :aria-current="esDestacadaActiva ? 'page' : undefined" :title="colapsado ? principal.texto : undefined" @click="emit('navegar')">
      <i class="pi pi-plus" />
      <span class="texto">{{ principal.texto }}</span>
    </RouterLink>

    <RouterLink
      v-for="o in lista"
      :key="o.ruta"
      :to="o.ruta"
      class="opcion"
      :class="{ activa: esActiva(o.ruta) }"
      :title="colapsado ? o.texto : undefined"
      :aria-current="esActiva(o.ruta) ? 'page' : undefined"
      @click="emit('navegar')"
    >
      <i :class="o.icono" />
      <span class="texto">{{ o.texto }}</span>
      <span v-if="insignia(o.ruta)" class="insignia" :class="insignia(o.ruta)!.clase" :data-insignia="o.ruta">{{ insignia(o.ruta)!.n > 99 ? '99+' : insignia(o.ruta)!.n }}</span>
    </RouterLink>
    <p v-if="!opciones.length" class="vacio">Aún no hay secciones disponibles.</p>
  </nav>
</template>

<style scoped>
.menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 12px;
}
.destacado {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0 0 12px;
  padding: 11px 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(147, 197, 253, 0.3);
  color: #e2e8f0;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.15s;
}
.destacado:hover {
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
}
.destacado.activa {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
  box-shadow: 0 4px 12px rgba(8, 20, 40, 0.35);
}
.destacado .pi {
  color: #6ee7b7;
}
.opcion {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  color: #cbd5e1;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s;
}
.opcion .pi {
  width: 20px;
  flex-shrink: 0;
  text-align: center;
  font-size: 1.05rem;
  color: #94a3b8;
}
.opcion:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}
.opcion:hover .pi {
  color: #e2e8f0;
}
.opcion.activa {
  background: #2563eb;
  color: #fff;
  box-shadow: 0 4px 12px rgba(8, 20, 40, 0.35);
}
.opcion.activa .pi {
  color: #fff;
}
.texto {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.insignia {
  flex-shrink: 0;
  min-width: 24px;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  text-align: center;
  border: 1px solid transparent;
}
.insignia.azul {
  background: rgba(59, 130, 246, 0.22);
  color: #bfdbfe;
  border-color: rgba(96, 165, 250, 0.35);
}
.insignia.ambar {
  background: rgba(245, 158, 11, 0.22);
  color: #fcd34d;
  border-color: rgba(251, 191, 36, 0.35);
}
.opcion.activa .insignia {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.3);
}
.vacio {
  font-size: 0.8rem;
  color: #94a3b8;
  padding: 0 12px;
}
</style>
