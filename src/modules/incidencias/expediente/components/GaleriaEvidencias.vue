<script setup lang="ts">
import { computed, ref } from 'vue'
import Button from 'primevue/button'
import { reglas } from '@/core/auth/reglas'
import { useSesionStore } from '@/core/auth/sesion.store'
import { usePermisos } from '@/core/auth/usePermisos'
import { MAX_ARCHIVOS, esImagen, formatearBytes } from '@/core/utils/archivos'
import { formatearFecha } from '@/core/utils/fechas'
import VisorImagen from '@/shared/components/VisorImagen.vue'
import PantallaVacia from '@/shared/components/PantallaVacia.vue'
import { urlEvidencia, type EvidenciaAdjunta, type Incidencia } from '../../types/incidencia.types'

const props = defineProps<{ incidencia: Incidencia }>()
const emit = defineEmits<{ agregar: [] }>()

const sesion = useSesionStore()
const { puede } = usePermisos()
const viendo = ref<EvidenciaAdjunta | null>(null)
const visor = computed({ get: () => viendo.value !== null, set: (v) => { if (!v) viendo.value = null } })
const evidencias = computed(() => props.incidencia.evidenciasAdjuntas)

/** Mismo criterio que el panel de acciones: permiso del rol + regla de la incidencia (cerrada, suya, asignada). */
const puedeAgregar = computed(
  () => puede('incidencias.evidencias') && !!sesion.usuario && reglas.evidencias(props.incidencia, sesion.usuario),
)
/** Rep y Téc: 3 evidencias propias por incidencia (Root sin límite). Se cuenta por usuario, como el backend. */
const propias = computed(() => evidencias.value.filter((e) => e.subidoPor?.idUsuario === sesion.usuario?.id).length)
const llegoAlLimite = computed(() => sesion.rol !== 'root' && propias.value >= MAX_ARCHIVOS)
</script>

<template>
  <section class="bloque">
    <header class="cabecera-bloque">
      <h2>
        <i class="pi pi-images" aria-hidden="true" /> Evidencias adjuntas
        <span v-if="evidencias.length" class="contador">{{ evidencias.length }}</span>
      </h2>
      <span class="sub">Documentación fotográfica y técnica</span>
      <Button
        v-if="puedeAgregar"
        label="Agregar evidencia"
        icon="pi pi-paperclip"
        size="small"
        severity="secondary"
        :disabled="llegoAlLimite"
        :title="llegoAlLimite ? `Ya subiste tus ${MAX_ARCHIVOS} evidencias en esta incidencia` : undefined"
        data-accion="evidencia-galeria"
        @click="emit('agregar')"
      />
    </header>

    <PantallaVacia v-if="!evidencias.length" icono="pi pi-images" titulo="Sin evidencias" texto="Aún no se han adjuntado fotos ni documentos." />

    <ul v-else class="galeria">
      <li v-for="e in evidencias" :key="e.publicId" class="evidencia">
        <div class="pieza">
        <button v-if="esImagen(`x.${e.formato}`)" type="button" class="visor" :title="`Ver ${e.nombreArchivo}`" :aria-label="`Ver ${e.nombreArchivo}`" @click="viendo = e">
          <img :src="urlEvidencia(e)" :alt="e.nombreArchivo" class="foto" />
        </button>
        <a
          v-else
          :href="urlEvidencia(e)"
          target="_blank"
          rel="noopener noreferrer"
          class="documento"
          :title="`Abrir ${e.nombreArchivo}`"
        >
          <i class="pi pi-file-pdf" />
          <span>Abrir PDF</span>
        </a>
        </div>
        <div class="pie">
          <p class="nombre" :title="e.nombreArchivo">{{ e.nombreArchivo }}</p>
          <p class="autor">
            <i class="pi pi-user" aria-hidden="true" />
            <strong>{{ e.subidoPor.nombre }}</strong>
            <span aria-hidden="true">·</span>
            {{ formatearFecha(e.fechaCarga) }}
            <template v-if="e.pesoKb"><span aria-hidden="true">·</span> {{ formatearBytes(e.pesoKb * 1024) }}</template>
          </p>
        </div>
      </li>
    </ul>
    <VisorImagen v-model:visible="visor" :src="viendo ? urlEvidencia(viendo) : ''" :titulo="viendo?.nombreArchivo" />
  </section>
</template>

<style scoped>
.cabecera-bloque {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 16px;
}
h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
}
h2 .pi {
  font-size: 0.85rem;
  color: #94a3b8;
}
.contador {
  padding: 1px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #f1f5f9;
  color: #334155;
  font-size: 0.72rem;
  font-weight: 700;
}
.sub {
  font-size: 0.72rem;
  color: #94a3b8;
}
.galeria {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
  gap: 16px;
}
.evidencia {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  background: #fff;
  border: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: 12px;
  transition: box-shadow 0.15s, border-color 0.15s;
}
.evidencia:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
}
.pieza {
  display: flex;
}
.visor {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: none;
  cursor: zoom-in;
}
.foto {
  display: block;
  width: 100%;
  height: 150px;
  object-fit: cover;
}
.documento {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  height: 150px;
  background: #fff1f2;
  color: #be123c;
  text-decoration: none;
  font-weight: 600;
}
.documento .pi {
  font-size: 2rem;
}
.pie {
  padding: 12px 14px;
  background: rgba(248, 250, 252, 0.7);
  border-top: 1px solid #f1f5f9;
}
.nombre {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.78rem;
  font-weight: 700;
  color: #1e293b;
}
.autor {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 6px;
  margin: 6px 0 0;
  font-size: 0.7rem;
  font-weight: 500;
  color: #64748b;
  overflow-wrap: anywhere;
}
.autor .pi {
  font-size: 0.65rem;
  color: #94a3b8;
}
.autor strong {
  font-weight: 600;
  color: #334155;
}
</style>
