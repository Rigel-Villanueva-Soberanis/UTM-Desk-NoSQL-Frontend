<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable, { type DataTablePageEvent, type DataTableRowClickEvent } from 'primevue/datatable'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'
import { usePermisos } from '@/core/auth/usePermisos'
import { ETIQUETA_ROL, normalizarRol } from '@/core/auth/permisos'
import { formatearDia } from '@/core/utils/fechas'
import { normalizarTexto } from '@/core/utils/texto'
import { useCatalogos } from '@/modules/catalogos/composables/useCatalogos'
import PantallaVacia from '@/shared/components/PantallaVacia.vue'
import RestablecerPasswordDialog from '../components/RestablecerPasswordDialog.vue'
import { useEliminarUsuario } from '../composables/useEliminarUsuario'
import { useUsuarios } from '../composables/useUsuarios'
import { ESTADOS_CUENTA, type Usuario } from '../types/usuario.types'

const router = useRouter()
const { usuario: yo } = usePermisos()
const { roles } = useCatalogos()
const { filtros, datos, cargando, error, hayFiltros, aplicarFiltros, irAPagina, limpiar, recargar } = useUsuarios()
const { pedir } = useEliminarUsuario()

const TAMANOS = [10, 20, 50]

// Búsqueda con espera (400 ms) para no pedir en cada tecla.
const busqueda = ref(filtros.value.busqueda)
const nombres = ref(filtros.value.nombres)
const apellidos = ref(filtros.value.apellidos)
let temporizador: ReturnType<typeof setTimeout> | undefined
function programar(campo: 'busqueda' | 'nombres' | 'apellidos', valor: string) {
  clearTimeout(temporizador)
  temporizador = setTimeout(() => {
    const v = valor.trim().replace(/\s+/g, ' ')
    if (v !== filtros.value[campo]) aplicarFiltros({ [campo]: v })
  }, 400)
}
watch(busqueda, (v) => programar('busqueda', v))
watch(nombres, (v) => programar('nombres', v))
watch(apellidos, (v) => programar('apellidos', v))
// Si la URL cambia (atrás, limpiar…), los campos de texto se actualizan.
watch(
  () => [filtros.value.busqueda, filtros.value.nombres, filtros.value.apellidos],
  ([b, n, a]) => {
    if ((b ?? '') !== busqueda.value.trim().replace(/\s+/g, ' ')) busqueda.value = b ?? ''
    if ((n ?? '') !== nombres.value.trim().replace(/\s+/g, ' ')) nombres.value = n ?? ''
    if ((a ?? '') !== apellidos.value.trim().replace(/\s+/g, ' ')) apellidos.value = a ?? ''
  },
)
onBeforeUnmount(() => clearTimeout(temporizador))

const clasificaciones = computed(() => [...new Set(roles.value.flatMap((r) => r.clasificaciones_permitidas))])

const etiquetaRol = (r: string) => ETIQUETA_ROL[normalizarRol(r)] ?? r
const severidad = (e: string) => {
  const n = normalizarTexto(e)
  return n === 'activo' ? 'success' : n === 'bloqueado' ? 'danger' : 'secondary'
}
const etiquetaEstado = (e: string) => ESTADOS_CUENTA.find((x) => x.valor === normalizarTexto(e))?.etiqueta ?? e
const esYo = (u: Usuario) => u.id === yo.value?.id

const primero = computed(() => (filtros.value.pagina - 1) * filtros.value.tamanoPagina)
const alPaginar = (e: DataTablePageEvent) => irAPagina(e.page + 1, e.rows)
const editar = (id: string) => router.push(`/usuarios/${id}`)
const alHacerClic = (e: DataTableRowClickEvent) => {
  const t = e.originalEvent?.target as HTMLElement | null
  if (t?.closest('button, a')) return
  void editar((e.data as Usuario).id)
}

const paraPassword = ref<Usuario | null>(null)
</script>

<template>
  <section>
    <div class="pagina-titulo cabecera">
      <div>
        <h1>Usuarios</h1>
        <p>Crea y administra las cuentas del sistema.</p>
      </div>
      <Button label="Nuevo usuario" icon="pi pi-plus" @click="router.push('/usuarios/nuevo')" />
    </div>

    <div class="tarjeta-base bloque">
      <div class="rejilla">
        <div class="campo ancho">
          <label for="u-busqueda">Buscar</label>
          <InputText id="u-busqueda" v-model="busqueda" maxlength="100" placeholder="Nombre, usuario o correo" fluid />
        </div>
        <div class="campo">
          <label for="u-nombres">Nombres</label>
          <InputText id="u-nombres" v-model="nombres" maxlength="100" fluid />
        </div>
        <div class="campo">
          <label for="u-apellidos">Apellidos</label>
          <InputText id="u-apellidos" v-model="apellidos" maxlength="100" fluid />
        </div>
        <div class="campo">
          <label for="u-rol">Rol</label>
          <Select
            input-id="u-rol"
            :model-value="filtros.rol || null"
            :options="roles"
            option-label="rol"
            option-value="rol"
            placeholder="Todos"
            show-clear
            fluid
            @update:model-value="(v) => aplicarFiltros({ rol: v ?? '' })"
          />
        </div>
        <div class="campo">
          <label for="u-clasificacion">Clasificación</label>
          <Select
            input-id="u-clasificacion"
            :model-value="filtros.clasificacion || null"
            :options="clasificaciones"
            placeholder="Todas"
            show-clear
            fluid
            @update:model-value="(v) => aplicarFiltros({ clasificacion: v ?? '' })"
          />
        </div>
        <div class="campo">
          <label for="u-estado">Estado</label>
          <Select
            input-id="u-estado"
            :model-value="filtros.estadoCuenta || null"
            :options="ESTADOS_CUENTA"
            option-label="etiqueta"
            option-value="valor"
            placeholder="Todos"
            show-clear
            fluid
            @update:model-value="(v) => aplicarFiltros({ estadoCuenta: v ?? '' })"
          />
        </div>
      </div>
      <div v-if="hayFiltros" class="pie">
        <Button label="Limpiar filtros" icon="pi pi-filter-slash" severity="secondary" text size="small" @click="limpiar" />
      </div>
    </div>

    <div v-if="error" class="tarjeta-base bloque">
      <PantallaVacia icono="pi pi-exclamation-triangle" titulo="No se pudo cargar el listado" :texto="error">
        <Button label="Reintentar" icon="pi pi-refresh" severity="secondary" @click="recargar" />
      </PantallaVacia>
    </div>

    <div v-else class="tarjeta-base bloque tabla">
      <DataTable
        :value="datos?.items ?? []"
        data-key="id"
        lazy
        paginator
        :rows="filtros.tamanoPagina"
        :first="primero"
        :total-records="datos?.total ?? 0"
        :rows-per-page-options="TAMANOS"
        :loading="cargando"
        paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
        current-page-report-template="{first}–{last} de {totalRecords}"
        row-hover
        :row-class="() => 'fila'"
        scrollable
        @page="alPaginar"
        @row-click="alHacerClic"
      >
        <template #empty>
          <div v-if="cargando" class="esqueleto" aria-hidden="true">
        <Skeleton v-for="n in 5" :key="n" height="2.5rem" />
      </div>
      <template v-else>
          <PantallaVacia
            v-if="hayFiltros"
            icono="pi pi-filter-slash"
            titulo="Sin resultados"
            texto="Ningún usuario coincide con los filtros."
          >
            <Button label="Limpiar filtros" severity="secondary" size="small" @click="limpiar" />
          </PantallaVacia>
          <PantallaVacia v-else icono="pi pi-users" titulo="No hay usuarios" texto="Crea el primer usuario con «Nuevo usuario»." />
          </template>
        </template>

        <Column header="Nombre" style="min-width: 11rem">
          <template #body="{ data }">
            <span class="celda una-linea nombre" :title="data.nombreCompleto">{{ data.nombreCompleto }}</span>
          </template>
        </Column>
        <Column header="Usuario" style="min-width: 8rem">
          <template #body="{ data }">
            <span class="celda una-linea" :title="data.usuario">{{ data.usuario }}</span>
          </template>
        </Column>
        <Column header="Correo" style="min-width: 11rem">
          <template #body="{ data }">
            <span class="celda una-linea" :title="data.correo">{{ data.correo }}</span>
          </template>
        </Column>
        <Column header="Rol" style="min-width: 8rem">
          <template #body="{ data }">
            <span class="celda una-linea">{{ etiquetaRol(data.rolSistema) }}</span>
          </template>
        </Column>
        <Column header="Clasificación" style="min-width: 8rem">
          <template #body="{ data }">
            <span v-if="data.clasificacionRol" class="celda una-linea" :title="data.clasificacionRol">{{ data.clasificacionRol }}</span>
            <span v-else class="sin">—</span>
          </template>
        </Column>
        <Column header="Estado" style="min-width: 7rem">
          <template #body="{ data }">
            <Tag :value="etiquetaEstado(data.estadoCuenta)" :severity="severidad(data.estadoCuenta)" :data-estado="data.estadoCuenta" />
          </template>
        </Column>
        <Column header="Alta" style="min-width: 7rem">
          <template #body="{ data }">{{ formatearDia(data.fechaCreacion) }}</template>
        </Column>
        <Column header="Acciones" style="min-width: 9rem">
          <template #body="{ data }">
            <div class="acciones">
              <Button icon="pi pi-pencil" severity="secondary" text rounded size="small" aria-label="Editar usuario" title="Editar" data-accion="editar" @click="editar(data.id)" />
              <Button icon="pi pi-key" severity="secondary" text rounded size="small" aria-label="Restablecer contraseña" title="Restablecer contraseña" data-accion="password" @click="paraPassword = data" />
              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                rounded
                size="small"
                aria-label="Eliminar usuario"
                :title="esYo(data) ? 'No puedes eliminar tu propia cuenta' : 'Eliminar'"
                :disabled="esYo(data)"
                data-accion="eliminar"
                @click="pedir(data, recargar)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <RestablecerPasswordDialog
      v-if="paraPassword"
      :usuario="paraPassword"
      @actualizado="recargar"
      @cerrado="paraPassword = null"
    />
  </section>
</template>

<style scoped>
.cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.bloque {
  margin-bottom: 16px;
}
.tabla {
  padding: 0;
  overflow: hidden;
}
.rejilla {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}
.campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.campo.ancho {
  grid-column: span 2;
}
label {
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--on-surface-variant);
}
.pie {
  margin-top: 12px;
}
.celda {
  max-width: 18rem;
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
.acciones {
  display: flex;
  gap: 2px;
}
@media (max-width: 640px) {
  .cabecera {
    flex-direction: column;
  }
  .campo.ancho {
    grid-column: auto;
  }
}
.esqueleto {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
}
</style>
