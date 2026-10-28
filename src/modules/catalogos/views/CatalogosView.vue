<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import Button from 'primevue/button'
import Skeleton from 'primevue/skeleton'
import { usePermisos } from '@/core/auth/usePermisos'
import { mensajeError } from '@/core/http/errores'
import PantallaVacia from '@/shared/components/PantallaVacia.vue'
import { listar } from '../api/catalogos.api'
import { CATALOGOS, type Catalogo, type Categoria, type Edificio, type RolCatalogo } from '../types/catalogo.types'

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

const MAX_CHIPS = 8
const contenido = (clave: string) => (datos.value.find((c) => c.claveCatalogo === clave)?.contenido ?? []) as unknown[]
const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

interface Chip { texto: string; extra?: string; resaltado?: boolean }
interface Resumen { badge: string; chips: Chip[]; meta: string[] }

/** Todo sale del GET /api/catalogos: no se inventa ningún dato. */
function resumen(clave: string): Resumen | null {
  const c = contenido(clave)
  if (!datos.value.some((x) => x.claveCatalogo === clave)) return null
  if (clave === 'edificios') {
    const l = c as Edificio[]
    const salones = l.reduce((t, e) => t + (e.salones?.length ?? 0), 0)
    return {
      badge: plural(l.length, 'edificio', 'edificios'),
      chips: l.map((e) => ({ texto: e.edificio, extra: `(${e.salones?.length ?? 0})` })),
      meta: [plural(l.length, 'edificio', 'edificios'), `${plural(salones, 'salón registrado', 'salones registrados')}`],
    }
  }
  if (clave === 'categorias_incidencia') {
    const l = c as Categoria[]
    const campos = l.reduce((t, x) => t + (x.campos_dinamicos?.length ?? 0), 0)
    return {
      badge: plural(l.length, 'categoría', 'categorías'),
      chips: l.map((x) => ({ texto: x.nombre, extra: `(${plural(x.campos_dinamicos?.length ?? 0, 'campo', 'campos')})` })),
      meta: [plural(l.length, 'categoría', 'categorías'), plural(campos, 'campo dinámico', 'campos dinámicos')],
    }
  }
  const l = c as RolCatalogo[]
  const con = l.filter((r) => r.clasificaciones_permitidas?.length).length
  return {
    badge: plural(l.length, 'rol', 'roles'),
    chips: l.map((r) => {
      const n = r.clasificaciones_permitidas?.length ?? 0
      return n ? { texto: r.rol, extra: `(${n} clasif.)`, resaltado: true } : { texto: r.rol }
    }),
    meta: [plural(l.length, 'rol', 'roles'), `${con} con subclasificación`],
  }
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
      <Skeleton v-for="n in 3" :key="n" height="18rem" border-radius="16px" />
    </div>

    <div v-else class="rejilla">
      <RouterLink
        v-for="c in CATALOGOS"
        :key="c.clave"
        :to="`/catalogos/${c.clave}`"
        class="tarjeta-base tarjeta"
        :class="`tono-${c.clave}`"
        :data-catalogo="c.clave"
      >
        <span class="franja" aria-hidden="true" />
        <div class="cabeza">
          <span class="icono"><i :class="c.icono" /></span>
          <span v-if="resumen(c.clave)" class="insignia"><span class="punto" />{{ resumen(c.clave)!.badge }}</span>
        </div>
        <h2>{{ c.titulo }}</h2>
        <p>{{ c.descripcion }}</p>
        <div v-if="resumen(c.clave)?.chips.length" class="chips">
          <span
            v-for="(ch, i) in resumen(c.clave)!.chips.slice(0, MAX_CHIPS)"
            :key="i"
            class="chip"
            :class="{ resaltado: ch.resaltado }"
            :title="ch.texto"
          >
            <span class="chip-texto">{{ ch.texto }}</span>
            <span v-if="ch.extra" class="extra">{{ ch.extra }}</span>
          </span>
          <span v-if="resumen(c.clave)!.chips.length > MAX_CHIPS" class="chip">+{{ resumen(c.clave)!.chips.length - MAX_CHIPS }} más</span>
        </div>
        <div v-if="resumen(c.clave)" class="meta">
          <span>{{ resumen(c.clave)!.meta[0] }}</span>
          <span class="sep">•</span>
          <span>{{ resumen(c.clave)!.meta[1] }}</span>
        </div>
        <div class="pie">
          <span class="ir">{{ editable ? 'Administrar catálogo' : 'Ver catálogo' }} <i class="pi pi-arrow-right" /></span>
          <span class="clave" :title="`Clave: ${c.clave}`">{{ c.clave }}</span>
        </div>
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.rejilla {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}
.tarjeta {
  --tono: #2563eb;
  --tono-suave: color-mix(in srgb, var(--tono) 10%, transparent);
  --tono-borde: color-mix(in srgb, var(--tono) 22%, transparent);
  --tono-franja: color-mix(in srgb, var(--tono) 55%, #6366f1);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 24px;
  border-radius: 16px;
  text-decoration: none;
  color: inherit;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s, border-color 0.25s;
}
.tarjeta:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
  border-color: var(--tono-borde);
}
.tono-edificios { --tono: #2563eb; --tono-franja: #6366f1; }
.tono-categorias_incidencia { --tono: #059669; --tono-franja: #0d9488; }
.tono-roles_sistema { --tono: #7c3aed; --tono-franja: #9333ea; }

.franja {
  position: absolute;
  inset: 0 0 auto 0;
  height: 4px;
  background: linear-gradient(90deg, var(--tono), var(--tono-franja));
}
.cabeza {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
}
.icono {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-size: 1.3rem;
  color: var(--tono);
  background: var(--tono-suave);
  border: 1px solid var(--tono-borde);
  transition: transform 0.2s, background 0.2s, color 0.2s;
}
.tarjeta:hover .icono {
  transform: scale(1.05);
  background: var(--tono);
  color: #fff;
}
.insignia {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--tono);
  background: var(--tono-suave);
  border: 1px solid var(--tono-borde);
  white-space: nowrap;
}
.punto {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--tono);
}
h2 {
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0;
  transition: color 0.2s;
}
.tarjeta:hover h2 {
  color: var(--tono);
}
p {
  margin: 8px 0 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--on-surface-variant);
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 14px;
}
.chip {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  max-width: 100%;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 500;
  background: var(--surface-low);
  border: 1px solid var(--outline-variant, rgba(100, 116, 139, 0.25));
}
.chip.resaltado {
  color: var(--tono);
  background: var(--tono-suave);
  border-color: var(--tono-borde);
}
.chip-texto {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.extra {
  font-weight: 400;
  opacity: 0.65;
  white-space: nowrap;
}
.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--outline-variant, rgba(100, 116, 139, 0.2));
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--on-surface-variant);
}
.sep {
  opacity: 0.5;
}
.pie {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;
  padding-top: 20px;
}
.ir {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--tono);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.ir i {
  font-size: 0.8rem;
  transition: transform 0.2s;
}
.tarjeta:hover .ir i {
  transform: translateX(4px);
}
.clave {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.68rem;
  color: var(--on-surface-variant);
  opacity: 0.8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
