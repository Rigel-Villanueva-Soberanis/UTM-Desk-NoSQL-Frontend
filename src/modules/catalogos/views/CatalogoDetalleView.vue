<script setup lang="ts">
import { PAGINADOR } from '@/shared/config/paginador'
import { computed, ref, toRef, watch } from 'vue'
import { RouterLink } from 'vue-router'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Skeleton from 'primevue/skeleton'
import { usePermisos } from '@/core/auth/usePermisos'
import { normalizarTexto } from '@/core/utils/texto'
import NoEncontrado from '@/shared/components/NoEncontrado.vue'
import PantallaVacia from '@/shared/components/PantallaVacia.vue'
import CategoriaDialog from '../components/CategoriaDialog.vue'
import EdificioDialog from '../components/EdificioDialog.vue'
import AgregarSalonesDialog from '../components/AgregarSalonesDialog.vue'
import RolDialog from '../components/RolDialog.vue'
import { useCatalogoDetalle } from '../composables/useCatalogoDetalle'
import { CATALOGOS, TIPOS_INPUT, type Categoria, type Edificio, type RolCatalogo } from '../types/catalogo.types'

const props = defineProps<{ clave: string }>()
const { puede } = usePermisos()
const editable = computed(() => puede('catalogos.editar'))
const { valida, contenido, cargando, error, noEncontrado, recargar, despuesDeEditar } = useCatalogoDetalle<Edificio | Categoria | RolCatalogo>(toRef(props, 'clave'))

const info = computed(() => CATALOGOS.find((c) => c.clave === props.clave))
const filas = computed(() => contenido.value)
const edificios = computed(() => (filas.value as Edificio[]).map((e) => ({ ...e, salones: Array.isArray(e.salones) ? e.salones : [] })))

// Edificios: filtro en pantalla (nombre, clave o salón) y resumen. Todo sale del GET del catálogo.
const MAX_SALONES = 4
const busqueda = ref('')
const primero = ref(0)
watch(busqueda, () => { primero.value = 0 })
watch(() => props.clave, () => { busqueda.value = ''; primero.value = 0 })
const totalSalones = computed(() => edificios.value.reduce((t, e) => t + e.salones.length, 0))
const edificiosFiltrados = computed(() => {
  const q = normalizarTexto(busqueda.value.trim())
  if (!q) return edificios.value
  return edificios.value.filter((e) => [e.clave, e.edificio, ...e.salones].some((t) => normalizarTexto(t).includes(q)))
})
const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`
const categorias = computed(() => (filas.value as Categoria[]).map((c) => ({ ...c, campos_dinamicos: Array.isArray(c.campos_dinamicos) ? c.campos_dinamicos : [] })))
const totalCampos = computed(() => categorias.value.reduce((t, c) => t + c.campos_dinamicos.length, 0))
const categoriasFiltradas = computed(() => {
  const q = normalizarTexto(busqueda.value.trim())
  if (!q) return categorias.value
  return categorias.value.filter((c) => [c.clave, c.nombre, ...c.campos_dinamicos.flatMap((f) => [f.etiqueta, f.clave])].some((t) => normalizarTexto(t).includes(q)))
})
const MAX_CAMPOS = 3
/** Categorías con la lista de campos desplegada (el resto muestra solo los primeros). */
const desplegadas = ref<string[]>([])
const estaDesplegada = (clave: string) => desplegadas.value.includes(clave)
const alternar = (clave: string) => {
  desplegadas.value = estaDesplegada(clave) ? desplegadas.value.filter((c) => c !== clave) : [...desplegadas.value, clave]
}
const MAX_OPCIONES = 3
/** Una categoría puede crearse en cualquier momento y no trae ícono: se usan sus iniciales y un color que sale de su clave (siempre el mismo). */
const COLORES = ['#2563eb', '#059669', '#7c3aed', '#d97706', '#db2777', '#0891b2', '#4f46e5', '#65a30d']
const colorDe = (clave: string) => COLORES[[...clave].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7) % COLORES.length]
const iniciales = (nombre: string) =>
  nombre.trim().split(/\s+/).filter((w) => w.length > 2 || nombre.trim().split(/\s+/).length === 1).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('') || '?'
const textoCampo = (c: { tipo_input: string; opciones?: string[] }) =>
  c.tipo_input === 'select' ? `${etiquetaTipo(c.tipo_input)} · ${plural(c.opciones?.length ?? 0, 'opción', 'opciones')}` : etiquetaTipo(c.tipo_input)
const roles = computed(() => (filas.value as RolCatalogo[]).map((r) => ({ ...r, clasificaciones_permitidas: Array.isArray(r.clasificaciones_permitidas) ? r.clasificaciones_permitidas : [] })))
const rolesFiltrados = computed(() => {
  const q = normalizarTexto(busqueda.value.trim())
  if (!q) return roles.value
  return roles.value.filter((r) => [r.rol, ...r.clasificaciones_permitidas].some((t) => normalizarTexto(t).includes(q)))
})
const MAX_CLASIFICACIONES = 4
/** Los 6 roles son fijos: cada uno tiene su color; si algún día aparece otro, su color sale de su nombre. */
const COLOR_ROL: Record<string, string> = { root: '#9333ea', administrativos: '#94a3b8', soporte: '#60a5fa', tecnico: '#f59e0b', reportante: '#10b981', directivos: '#06b6d4' }
const colorRol = (rol: string) => COLOR_ROL[normalizarTexto(rol).split(' ')[0] ?? ''] ?? colorDe(rol)
const claves = computed(() => (props.clave === 'roles_sistema' ? [] : filas.value.map((x) => (x as Edificio | Categoria).clave)))

// Diálogo abierto: nuevo, editar un elemento, o agregarle salones / campos / clasificaciones.
const dialogo = ref<null | 'nuevo' | 'editar' | 'salones' | 'campos' | 'clasificaciones'>(null)
const seleccionado = ref<Edificio | Categoria | RolCatalogo | null>(null)
const nuevo = () => { seleccionado.value = null; dialogo.value = 'nuevo' }
const editar = (x: Edificio | Categoria | RolCatalogo) => { seleccionado.value = x; dialogo.value = 'editar' }
const agregarCampos = (x: Categoria) => { seleccionado.value = x; dialogo.value = 'campos' }
const agregarClasificaciones = (x: RolCatalogo) => { seleccionado.value = x; dialogo.value = 'clasificaciones' }
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
        <h1>
          {{ info?.titulo }}
          <span v-if="clave === 'edificios' && !cargando && !error" class="resumen-titulo"><span class="punto" />{{ plural(edificios.length, 'edificio', 'edificios') }} · {{ plural(totalSalones, 'salón', 'salones') }}</span>
          <span v-else-if="clave === 'categorias_incidencia' && !cargando && !error" class="resumen-titulo"><span class="punto" />{{ plural(categorias.length, 'categoría', 'categorías') }} · {{ plural(totalCampos, 'campo', 'campos') }}</span>
        </h1>
        <p>{{ info?.descripcion }}</p>
      </div>
      <div v-if="editable && !error" class="botones">
        <Button v-if="clave !== 'roles_sistema'" :label="textoNuevo" icon="pi pi-plus" :disabled="cargando" data-accion="agregar" @click="nuevo" />
      </div>
    </div>
    <p v-if="!editable" class="solo-lectura"><i class="pi pi-lock" /> Solo lectura: tu rol no puede modificar los catálogos.</p>

    <div v-if="error" class="tarjeta-base">
      <PantallaVacia icono="pi pi-exclamation-triangle" titulo="No se pudo cargar el catálogo" :texto="error">
        <Button label="Reintentar" icon="pi pi-refresh" severity="secondary" @click="recargar" />
      </PantallaVacia>
    </div>

    <template v-else-if="clave === 'edificios' || clave === 'categorias_incidencia' || clave === 'roles_sistema'">
      <div class="tarjeta-base barra-filtro">
        <IconField class="buscar">
          <InputIcon class="pi pi-search" />
          <InputText v-model="busqueda" maxlength="100" 
            :placeholder="clave === 'edificios' ? 'Filtrar por nombre, salón o clave…' : clave === 'roles_sistema' ? 'Buscar rol o clasificación…' : 'Filtrar por nombre, campo o clave…'"
            aria-label="Filtrar el catálogo" fluid />
        </IconField>
        <span class="acciones-barra">
          <span v-if="clave === 'roles_sistema' && !cargando" class="insignia-barra">{{ plural(roles.length, 'rol registrado', 'roles registrados') }}</span>
          <Button icon="pi pi-refresh" severity="secondary" text rounded :loading="cargando" aria-label="Recargar" title="Recargar" data-accion="recargar" @click="recargar" />
        </span>
      </div>

      <div class="tarjeta-base tabla">
        <DataTable v-if="clave === 'edificios'" v-model:first="primero" :value="edificiosFiltrados" data-key="clave" :loading="cargando" scrollable v-bind="PAGINADOR" :rows="20" row-hover>
          <template #empty>
            <div v-if="cargando" class="esqueleto" aria-hidden="true"><Skeleton v-for="n in 5" :key="n" height="3rem" /></div>
            <PantallaVacia v-else-if="busqueda" icono="pi pi-search" titulo="Sin resultados" texto="Ningún edificio ni salón coincide con lo que escribiste." />
            <PantallaVacia v-else titulo="Sin edificios" texto="Agrega el primer edificio." />
          </template>
          <Column header="Clave" style="min-width: 9rem">
            <template #body="{ data }"><code class="clave-chip" :title="data.clave">{{ data.clave }}</code></template>
          </Column>
          <Column header="Edificio" style="min-width: 13rem">
            <template #body="{ data }">
              <div class="edificio">
                <span class="icono-edificio"><i class="pi pi-building" /></span>
                <div class="edificio-texto">
                  <span class="edificio-nombre una-linea" :title="data.edificio">{{ data.edificio }}</span>
                  <small>{{ plural(data.salones.length, 'salón', 'salones') }}</small>
                </div>
              </div>
            </template>
          </Column>
          <Column header="Salones y espacios asociados" style="min-width: 18rem">
            <template #body="{ data }">
              <span v-if="!data.salones.length" class="sin">Sin salones</span>
              <span v-else class="chips">
                <span v-for="s in data.salones.slice(0, MAX_SALONES)" :key="s" class="salon" :title="s">{{ s }}</span>
                <component
                  :is="editable ? 'button' : 'span'"
                  v-if="data.salones.length > MAX_SALONES"
                  class="mas"
                  :class="{ clicable: editable }"
                  :type="editable ? 'button' : undefined"
                  :title="data.salones.slice(MAX_SALONES).join(', ')"
                  @click.stop="editable && editar(data)"
                >+{{ data.salones.length - MAX_SALONES }} más</component>
              </span>
            </template>
          </Column>
          <Column v-if="editable" header="Acciones" style="width: 8rem">
            <template #body="{ data }">
              <div class="acciones">
                <Button icon="pi pi-plus" text rounded size="small" severity="secondary" aria-label="Agregar salones" title="Agregar salones" data-accion="salones" @click="verSalones(data)" />
                <Button icon="pi pi-pencil" text rounded size="small" severity="secondary" aria-label="Editar edificio y sus salones" title="Editar edificio y sus salones" data-accion="editar" @click="editar(data)" />
              </div>
            </template>
          </Column>
        </DataTable>

        <DataTable v-else-if="clave === 'categorias_incidencia'" v-model:first="primero" :value="categoriasFiltradas" data-key="clave" :loading="cargando" scrollable v-bind="PAGINADOR" :rows="20" row-hover>
          <template #empty>
            <div v-if="cargando" class="esqueleto" aria-hidden="true"><Skeleton v-for="n in 5" :key="n" height="3rem" /></div>
            <PantallaVacia v-else-if="busqueda" icono="pi pi-search" titulo="Sin resultados" texto="Ninguna categoría ni campo coincide con lo que escribiste." />
            <PantallaVacia v-else titulo="Sin categorías" texto="Agrega la primera categoría." />
          </template>
          <Column header="Clave" style="min-width: 9rem">
            <template #body="{ data }"><code class="clave-chip" :title="data.clave">{{ data.clave }}</code></template>
          </Column>
          <Column header="Categoría" style="min-width: 13rem">
            <template #body="{ data }">
              <div class="edificio">
                <span class="icono-edificio" :style="{ '--c': colorDe(data.clave) }" aria-hidden="true">{{ iniciales(data.nombre) }}</span>
                <div class="edificio-texto">
                  <span class="edificio-nombre una-linea" :title="data.nombre">{{ data.nombre }}</span>
                  <small>{{ plural(data.campos_dinamicos.length, 'campo configurado', 'campos configurados') }}</small>
                </div>
              </div>
            </template>
          </Column>
          <Column header="Campos adicionales / Formulario" style="min-width: 20rem">
            <template #body="{ data }">
              <span v-if="!data.campos_dinamicos.length" class="sin">Sin campos adicionales</span>
              <div v-else class="campos-celda">
                <span class="chips" :class="{ desplegada: estaDesplegada(data.clave) }">
                  <span v-for="c in (estaDesplegada(data.clave) ? data.campos_dinamicos : data.campos_dinamicos.slice(0, MAX_CAMPOS))" :key="c.clave" class="campo-card" :title="c.tipo_input === 'select' ? (c.opciones ?? []).join(', ') : undefined">
                    <span class="campo-linea">
                      <span class="campo-nombre" :title="c.etiqueta">{{ c.etiqueta }}</span>
                      <span class="campo-tipo">{{ textoCampo(c) }}</span>
                      <span v-if="c.requerido" class="campo-oblig">Obligatorio</span>
                    </span>
                    <span v-if="estaDesplegada(data.clave) && c.tipo_input === 'select' && c.opciones?.length" class="opciones">
                      <span v-for="o in c.opciones.slice(0, MAX_OPCIONES)" :key="o" :title="o">{{ o }}</span>
                      <span v-if="c.opciones.length > MAX_OPCIONES" class="mas-opc" :title="c.opciones.slice(MAX_OPCIONES).join(', ')">+{{ c.opciones.length - MAX_OPCIONES }}</span>
                    </span>
                  </span>
                </span>
                <button v-if="data.campos_dinamicos.length > MAX_CAMPOS" type="button" class="mas clicable" :aria-expanded="estaDesplegada(data.clave)" @click.stop="alternar(data.clave)">
                  {{ estaDesplegada(data.clave) ? 'Ver menos' : `+${data.campos_dinamicos.length - MAX_CAMPOS} más` }}
                  <i :class="estaDesplegada(data.clave) ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" />
                </button>
              </div>
            </template>
          </Column>
          <Column v-if="editable" header="Acciones" style="width: 8rem">
            <template #body="{ data }">
              <div class="acciones">
                <Button icon="pi pi-plus" text rounded size="small" severity="secondary" aria-label="Agregar campos" :title="data.campos_dinamicos.length >= 20 ? 'Ya tiene el máximo de 20 campos' : 'Agregar campos'" :disabled="data.campos_dinamicos.length >= 20" data-accion="campos" @click="agregarCampos(data)" />
                <Button icon="pi pi-pencil" text rounded size="small" severity="secondary" aria-label="Editar categoría y sus campos" title="Editar categoría y sus campos" data-accion="editar" @click="editar(data)" />
              </div>
            </template>
          </Column>
        </DataTable>

        <DataTable v-else v-model:first="primero" :value="rolesFiltrados" data-key="rol" :loading="cargando" scrollable v-bind="PAGINADOR" :rows="10" row-hover>
          <template #empty>
            <div v-if="cargando" class="esqueleto" aria-hidden="true"><Skeleton v-for="n in 6" :key="n" height="3rem" /></div>
            <PantallaVacia v-else-if="busqueda" icono="pi pi-search" titulo="Sin resultados" texto="Ningún rol ni clasificación coincide con lo que escribiste." />
            <PantallaVacia v-else titulo="Sin roles" />
          </template>
          <Column header="Rol" style="min-width: 11rem">
            <template #body="{ data }">
              <span class="rol"><span class="dot-rol" :style="{ background: colorRol(data.rol) }" /><span class="nombre">{{ data.rol }}</span></span>
            </template>
          </Column>
          <Column header="Requiere clasificación" style="min-width: 11rem">
            <template #body="{ data }"><span class="req" :class="{ si: data.requiere_clasificacion }">{{ data.requiere_clasificacion ? 'Sí' : 'No' }}</span></template>
          </Column>
          <Column header="Clasificaciones permitidas" style="min-width: 16rem">
            <template #body="{ data }">
              <span v-if="!data.clasificaciones_permitidas.length" class="sin">—</span>
              <span v-else class="chips">
                <span v-for="c in data.clasificaciones_permitidas.slice(0, MAX_CLASIFICACIONES)" :key="c" class="salon" :title="c">{{ c }}</span>
                <component
                  :is="editable ? 'button' : 'span'"
                  v-if="data.clasificaciones_permitidas.length > MAX_CLASIFICACIONES"
                  class="mas"
                  :class="{ clicable: editable }"
                  :type="editable ? 'button' : undefined"
                  :title="data.clasificaciones_permitidas.slice(MAX_CLASIFICACIONES).join(', ')"
                  @click.stop="editable && editar(data)"
                >+{{ data.clasificaciones_permitidas.length - MAX_CLASIFICACIONES }} más</component>
              </span>
            </template>
          </Column>
          <Column v-if="editable" header="Acciones" style="width: 8rem">
            <template #body="{ data }">
              <div class="acciones">
                <Button icon="pi pi-plus" text rounded size="small" severity="secondary" :aria-label="`Agregar clasificación a ${data.rol}`" :title="`Agregar clasificación a ${data.rol}`" data-accion="clasificaciones" @click="agregarClasificaciones(data)" />
                <Button icon="pi pi-pencil" text rounded size="small" severity="secondary" :aria-label="`Editar clasificaciones de ${data.rol}`" :title="`Editar clasificaciones de ${data.rol}`" data-accion="editar" @click="editar(data)" />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </template>

    <EdificioDialog v-if="clave === 'edificios' && (dialogo === 'nuevo' || dialogo === 'editar')" :elemento="(seleccionado as Edificio | null) ?? undefined" :existentes="claves" @cerrar="cerrar" @actualizar="despuesDeEditar" />
    <AgregarSalonesDialog v-if="clave === 'edificios' && dialogo === 'salones' && seleccionado" :elemento="seleccionado as Edificio" @cerrar="cerrar" @actualizar="despuesDeEditar" />
    <CategoriaDialog v-if="clave === 'categorias_incidencia' && (dialogo === 'nuevo' || dialogo === 'editar' || (dialogo === 'campos' && seleccionado))" :elemento="(seleccionado as Categoria | null) ?? undefined" :solo-campos="dialogo === 'campos'" :existentes="claves" @cerrar="cerrar" @actualizar="despuesDeEditar" />
    <RolDialog v-if="clave === 'roles_sistema' && (dialogo === 'editar' || dialogo === 'clasificaciones') && seleccionado" :elemento="seleccionado as RolCatalogo" :solo-agregar="dialogo === 'clasificaciones'" @cerrar="cerrar" @actualizar="despuesDeEditar" />
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
.resumen-titulo {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-left: 10px;
  padding: 4px 12px;
  border-radius: 999px;
  vertical-align: middle;
  font-size: 0.75rem;
  font-weight: 600;
  color: #2563eb;
  background: color-mix(in srgb, #2563eb 10%, transparent);
  border: 1px solid color-mix(in srgb, #2563eb 22%, transparent);
}
.punto {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2563eb;
}
.barra-filtro {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px 14px;
}
.buscar {
  flex: 1;
  max-width: 22rem;
}
.clave-chip {
  display: inline-block;
  max-width: 100%;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 0.78rem;
  background: var(--surface-low);
  border: 1px solid var(--outline-variant, rgba(100, 116, 139, 0.25));
  color: var(--on-surface-variant);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.edificio {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.icono-edificio {
  --c: #2563eb;
  flex-shrink: 0;
  font-size: 0.8rem;
  font-weight: 700;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: var(--c);
  background: color-mix(in srgb, var(--c) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--c) 25%, transparent);
}
.edificio-texto {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.edificio-nombre {
  display: block;
  max-width: 16rem;
  font-weight: 600;
}
.edificio-texto small {
  color: var(--on-surface-variant);
}
.salon {
  max-width: 11rem;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 500;
  background: var(--surface-low);
  border: 1px solid var(--outline-variant, rgba(100, 116, 139, 0.25));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mas {
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  color: #2563eb;
  background: color-mix(in srgb, #2563eb 10%, transparent);
  border: 1px solid color-mix(in srgb, #2563eb 25%, transparent);
  font-family: inherit;
}
.mas.clicable {
  cursor: pointer;
}
.mas.clicable:hover {
  background: color-mix(in srgb, #2563eb 18%, transparent);
}
.campos-celda {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  width: 100%;
}
.chips.desplegada {
  max-height: 14rem;
  overflow-y: auto;
  padding-right: 4px;
}
.mas i {
  margin-left: 4px;
  font-size: 0.65rem;
}
.campo-card {
  display: inline-flex;
  flex-direction: column;
  gap: 4px;
  max-width: 100%;
  padding: 5px 10px;
  border-radius: 12px;
  background: var(--surface-low);
  border: 1px solid var(--outline-variant, rgba(100, 116, 139, 0.25));
}
.campo-linea {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.campo-nombre {
  font-size: 0.8rem;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.campo-tipo,
.campo-oblig {
  flex-shrink: 0;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 0.68rem;
  font-weight: 600;
  white-space: nowrap;
}
.campo-tipo {
  color: var(--on-surface-variant);
  background: color-mix(in srgb, var(--on-surface-variant) 12%, transparent);
}
.campo-oblig {
  color: #b45309;
  background: color-mix(in srgb, #d97706 14%, transparent);
}
.opciones {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  color: var(--on-surface-variant);
}
.opciones > span {
  max-width: 9rem;
  padding: 0 6px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--on-surface-variant) 10%, transparent);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.acciones-barra {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.insignia-barra {
  padding: 3px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--on-surface-variant);
  background: var(--surface-low);
  white-space: nowrap;
}
.rol {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.dot-rol {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.req {
  padding: 2px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--on-surface-variant);
  background: var(--surface-low);
  border: 1px solid var(--outline-variant, rgba(100, 116, 139, 0.25));
}
.req.si {
  font-weight: 600;
  color: #047857;
  background: color-mix(in srgb, #10b981 12%, transparent);
  border-color: color-mix(in srgb, #10b981 30%, transparent);
}
.acciones {
  display: flex;
  gap: 2px;
}
.esqueleto {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
}
</style>
