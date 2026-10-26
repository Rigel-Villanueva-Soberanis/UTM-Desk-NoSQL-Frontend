<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import { RouterLink } from 'vue-router'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'
import { usePermisos } from '@/core/auth/usePermisos'
import NoEncontrado from '@/shared/components/NoEncontrado.vue'
import PantallaVacia from '@/shared/components/PantallaVacia.vue'
import CategoriaDialog from '../components/CategoriaDialog.vue'
import EdificioDialog from '../components/EdificioDialog.vue'
import SalonesDialog from '../components/SalonesDialog.vue'
import ReemplazarDialog from '../components/ReemplazarDialog.vue'
import RolDialog from '../components/RolDialog.vue'
import { useCatalogoDetalle } from '../composables/useCatalogoDetalle'
import { CATALOGOS, TIPOS_INPUT, type Categoria, type ClaveCatalogo, type Edificio, type RolCatalogo } from '../types/catalogo.types'

const props = defineProps<{ clave: string }>()
const { puede } = usePermisos()
const editable = computed(() => puede('catalogos.editar'))
const { valida, contenido, cargando, error, noEncontrado, recargar, despuesDeEditar } = useCatalogoDetalle<Edificio | Categoria | RolCatalogo>(toRef(props, 'clave'))

const info = computed(() => CATALOGOS.find((c) => c.clave === props.clave))
const claveTipada = computed(() => props.clave as ClaveCatalogo)
const filas = computed(() => contenido.value)
const edificios = computed(() => (filas.value as Edificio[]).map((e) => ({ ...e, salones: Array.isArray(e.salones) ? e.salones : [] })))
const categorias = computed(() => filas.value as Categoria[])
const roles = computed(() => filas.value as RolCatalogo[])
const claves = computed(() => (props.clave === 'roles_sistema' ? [] : filas.value.map((x) => (x as Edificio | Categoria).clave)))

// Diálogo abierto: 'nuevo', un elemento a editar, o 'reemplazar'.
const dialogo = ref<null | 'nuevo' | 'reemplazar' | 'editar' | 'salones'>(null)
const seleccionado = ref<Edificio | Categoria | RolCatalogo | null>(null)
const nuevo = () => { seleccionado.value = null; dialogo.value = 'nuevo' }
const editar = (x: Edificio | Categoria | RolCatalogo) => { seleccionado.value = x; dialogo.value = 'editar' }
const verSalones = (x: Edificio) => { seleccionado.value = x; dialogo.value = 'salones' }
const cerrar = () => { dialogo.value = null; seleccionado.value = null }

const etiquetaTipo = (t: string) => TIPOS_INPUT.find((x) => x.valor === t)?.etiqueta ?? t
const textoNuevo = computed(() => (props.clave === 'edificios' ? 'Agregar edificio' : 'Agregar categoría'))
</script>

<template>
  <NoEncontrado v-if="!valida || noEncontrado" titulo="Catálogo no encontrado" texto="Ese catálogo no existe." />

  <section v-else>
    <RouterLink to="/catalogos" class="volver"><i class="pi pi-arrow-left" /> Catálogos</RouterLink>
    <div class="pagina-titulo cabecera">
      <div>
        <h1>{{ info?.titulo }}</h1>
        <p>{{ info?.descripcion }}</p>
      </div>
      <div v-if="editable && !error" class="botones">
        <Button v-if="clave !== 'roles_sistema'" :label="textoNuevo" icon="pi pi-plus" :disabled="cargando" data-accion="agregar" @click="nuevo" />
        <Button label="Editor avanzado" icon="pi pi-code" severity="secondary" :disabled="cargando || !filas.length" data-accion="reemplazar" @click="dialogo = 'reemplazar'" />
      </div>
    </div>
    <p v-if="!editable" class="solo-lectura"><i class="pi pi-lock" /> Solo lectura: tu rol no puede modificar los catálogos.</p>

    <div v-if="error" class="tarjeta-base">
      <PantallaVacia icono="pi pi-exclamation-triangle" titulo="No se pudo cargar el catálogo" :texto="error">
        <Button label="Reintentar" icon="pi pi-refresh" severity="secondary" @click="recargar" />
      </PantallaVacia>
    </div>

    <div v-else class="tarjeta-base tabla">
      <!-- Edificios -->
      <DataTable v-if="clave === 'edificios'" :value="edificios" data-key="clave" :loading="cargando" scrollable paginator :rows="20" :rows-per-page-options="[10, 20, 50]">
        <template #empty><div v-if="cargando" class="esqueleto" aria-hidden="true"><Skeleton v-for="n in 5" :key="n" height="2.5rem" /></div><PantallaVacia v-else titulo="Sin edificios" texto="Agrega el primer edificio." /></template>
        <Column header="Clave" style="min-width: 8rem"><template #body="{ data }"><code class="celda una-linea" :title="data.clave">{{ data.clave }}</code></template></Column>
        <Column header="Edificio" style="min-width: 10rem"><template #body="{ data }"><span class="celda una-linea" :title="data.edificio">{{ data.edificio }}</span></template></Column>
        <Column header="Salones" style="min-width: 16rem">
          <template #body="{ data }">
            <span v-if="!data.salones.length" class="sin">Sin salones</span>
            <span v-else class="chips">
              <Tag v-for="s in data.salones.slice(0, 4)" :key="s" :value="s" severity="secondary" />
              <Tag v-if="data.salones.length > 4" :value="`+${data.salones.length - 4} más`" severity="info" />
            </span>
          </template>
        </Column>
        <Column v-if="editable" header="" style="width: 9rem">
          <template #body="{ data }">
            <Button icon="pi pi-list" text rounded size="small" severity="secondary" aria-label="Salones del edificio" title="Salones" data-accion="salones" @click="verSalones(data)" />
            <Button icon="pi pi-pencil" text rounded size="small" severity="secondary" aria-label="Editar edificio" title="Editar nombre" data-accion="editar" @click="editar(data)" />
          </template>
        </Column>
      </DataTable>

      <!-- Categorías -->
      <DataTable v-else-if="clave === 'categorias_incidencia'" :value="categorias" data-key="clave" :loading="cargando" scrollable paginator :rows="20" :rows-per-page-options="[10, 20, 50]">
        <template #empty><div v-if="cargando" class="esqueleto" aria-hidden="true"><Skeleton v-for="n in 5" :key="n" height="2.5rem" /></div><PantallaVacia v-else titulo="Sin categorías" texto="Agrega la primera categoría." /></template>
        <Column header="Clave" style="min-width: 8rem"><template #body="{ data }"><code class="celda una-linea" :title="data.clave">{{ data.clave }}</code></template></Column>
        <Column header="Nombre" style="min-width: 10rem"><template #body="{ data }"><span class="celda una-linea nombre" :title="data.nombre">{{ data.nombre }}</span></template></Column>
        <Column header="Campos adicionales" style="min-width: 16rem">
          <template #body="{ data }">
            <span v-if="!data.campos_dinamicos?.length" class="sin">Ninguno</span>
            <ul v-else class="campos">
              <li v-for="c in data.campos_dinamicos" :key="c.clave">
                <span class="celda una-linea" :title="c.etiqueta">{{ c.etiqueta }}</span>
                <Tag :value="etiquetaTipo(c.tipo_input)" severity="secondary" />
                <Tag v-if="c.requerido" value="Obligatorio" severity="warn" />
              </li>
            </ul>
          </template>
        </Column>
        <Column v-if="editable" header="" style="width: 4rem"><template #body="{ data }"><Button icon="pi pi-pencil" text rounded size="small" severity="secondary" aria-label="Editar categoría" data-accion="editar" @click="editar(data)" /></template></Column>
      </DataTable>

      <!-- Roles -->
      <DataTable v-else :value="roles" data-key="rol" :loading="cargando" scrollable>
        <template #empty><div v-if="cargando" class="esqueleto" aria-hidden="true"><Skeleton v-for="n in 5" :key="n" height="2.5rem" /></div><PantallaVacia v-else titulo="Sin roles" /></template>
        <Column header="Rol" style="min-width: 9rem"><template #body="{ data }"><span class="nombre">{{ data.rol }}</span></template></Column>
        <Column header="Requiere clasificación" style="min-width: 10rem"><template #body="{ data }">{{ data.requiere_clasificacion ? 'Sí' : 'No' }}</template></Column>
        <Column header="Clasificaciones permitidas" style="min-width: 14rem">
          <template #body="{ data }">
            <span v-if="!data.clasificaciones_permitidas?.length" class="sin">—</span>
            <span v-else class="chips"><Tag v-for="c in data.clasificaciones_permitidas" :key="c" :value="c" severity="secondary" /></span>
          </template>
        </Column>
        <Column v-if="editable" header="" style="width: 4rem"><template #body="{ data }"><Button icon="pi pi-pencil" text rounded size="small" severity="secondary" aria-label="Editar clasificaciones" data-accion="editar" @click="editar(data)" /></template></Column>
      </DataTable>
    </div>

    <EdificioDialog v-if="clave === 'edificios' && (dialogo === 'nuevo' || dialogo === 'editar')" :elemento="(seleccionado as Edificio | null) ?? undefined" :existentes="claves" @cerrar="cerrar" @actualizar="despuesDeEditar" />
    <SalonesDialog v-if="clave === 'edificios' && dialogo === 'salones' && seleccionado" :elemento="seleccionado as Edificio" @cerrar="cerrar" @actualizar="despuesDeEditar" />
    <CategoriaDialog v-if="clave === 'categorias_incidencia' && (dialogo === 'nuevo' || dialogo === 'editar')" :elemento="(seleccionado as Categoria | null) ?? undefined" :existentes="claves" @cerrar="cerrar" @actualizar="despuesDeEditar" />
    <RolDialog v-if="clave === 'roles_sistema' && dialogo === 'editar' && seleccionado" :elemento="seleccionado as RolCatalogo" @cerrar="cerrar" @actualizar="despuesDeEditar" />
    <ReemplazarDialog v-if="dialogo === 'reemplazar'" :clave="claveTipada" :titulo="info?.titulo ?? clave" :actual="filas" @cerrar="cerrar" @actualizar="despuesDeEditar" />
  </section>
</template>

<style scoped>
.volver {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  text-decoration: none;
}
.cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.botones {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.solo-lectura {
  color: var(--on-surface-variant);
  margin: 0 0 12px;
}
.tabla {
  padding: 0;
  overflow: hidden;
}
.celda {
  max-width: 20rem;
}
.celda.una-linea {
  display: block;
}
.nombre {
  font-weight: 600;
}
.sin {
  color: var(--on-surface-variant);
}
.campos {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.campos li {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.esqueleto {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
}
</style>
