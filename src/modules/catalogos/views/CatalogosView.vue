<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import Button from 'primevue/button'
import Skeleton from 'primevue/skeleton'
import { usePermisos } from '@/core/auth/usePermisos'
import { mensajeError } from '@/core/http/errores'
import PantallaVacia from '@/shared/components/PantallaVacia.vue'
import { listar } from '../api/catalogos.api'
import { CATALOGOS, type Catalogo } from '../types/catalogo.types'

const { puede } = usePermisos()
const editable = computed(() => puede('catalogos.editar'))
const datos = ref<Catalogo<unknown>[]>([])
const cargando = ref(true)
const error = ref('')

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    datos.value = await listar()
  } catch (e) {
    error.value = mensajeError(e)
  } finally {
    cargando.value = false
  }
}
onMounted(cargar)

const cuantos = (clave: string) => datos.value.find((c) => c.claveCatalogo === clave)?.contenido?.length
const texto = (clave: string) => {
  const n = cuantos(clave)
  if (n === undefined) return ''
  return clave === 'roles_sistema' ? `${n} ${n === 1 ? 'rol' : 'roles'}` : `${n} ${n === 1 ? 'elemento' : 'elementos'}`
}
</script>

<template>
  <section>
    <div class="pagina-titulo">
      <h1>Catálogos</h1>
      <p>{{ editable ? 'Consulta y administra los datos base del sistema.' : 'Consulta los datos base del sistema.' }}</p>
    </div>

    <div v-if="error" class="tarjeta-base">
      <PantallaVacia icono="pi pi-exclamation-triangle" titulo="No se pudieron cargar los catálogos" :texto="error">
        <Button label="Reintentar" icon="pi pi-refresh" severity="secondary" @click="cargar" />
      </PantallaVacia>
    </div>

    <div v-else-if="cargando" class="rejilla" aria-busy="true" data-esqueleto>
      <Skeleton v-for="n in 3" :key="n" height="9rem" />
    </div>

    <div v-else class="rejilla">
      <RouterLink v-for="c in CATALOGOS" :key="c.clave" :to="`/catalogos/${c.clave}`" class="tarjeta-base tarjeta" :data-catalogo="c.clave">
        <i :class="c.icono" />
        <div class="texto">
          <h2>{{ c.titulo }}</h2>
          <p>{{ c.descripcion }}</p>
          <small v-if="texto(c.clave)">{{ texto(c.clave) }}</small>
        </div>
        <span class="ir">{{ editable ? 'Administrar' : 'Ver' }} <i class="pi pi-arrow-right" /></span>
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.rejilla {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.tarjeta {
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-decoration: none;
  color: inherit;
  transition: box-shadow 0.15s;
}
.tarjeta:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
}
.tarjeta > i {
  font-size: 1.6rem;
  color: var(--accent);
}
h2 {
  font-size: 1.1rem;
  margin: 0 0 4px;
}
p {
  margin: 0 0 6px;
  color: var(--on-surface-variant);
}
small {
  color: var(--on-surface-variant);
  font-weight: 600;
}
.ir {
  margin-top: auto;
  font-weight: 600;
  color: var(--accent);
}
</style>
