<script setup lang="ts">
import EtiquetaTag from '@/shared/components/EtiquetaTag.vue'
import { computed } from 'vue'
import { useCatalogos } from '@/modules/catalogos/composables/useCatalogos'
import type { Incidencia } from '../../types/incidencia.types'

const props = defineProps<{ incidencia: Incidencia }>()
const { categoriaPorClave } = useCatalogos()

const categoria = computed(() => categoriaPorClave(props.incidencia.categoria))

const humanizar = (clave: string) => {
  const t = clave.replace(/_/g, ' ')
  return t.charAt(0).toUpperCase() + t.slice(1)
}

/** `detalleEspecifico` con la `etiqueta` del catálogo (en el orden del catálogo). */
const detalle = computed(() => {
  const campos = categoria.value?.campos_dinamicos ?? []
  return Object.entries(props.incidencia.detalleEspecifico)
    .map(([clave, valor]) => ({
      clave,
      etiqueta: campos.find((c) => c.clave === clave)?.etiqueta ?? humanizar(clave),
      valor: String(valor),
      orden: campos.findIndex((c) => c.clave === clave),
    }))
    .sort((a, b) => (a.orden < 0 ? 999 : a.orden) - (b.orden < 0 ? 999 : b.orden))
})

const externo = computed(() =>
  props.incidencia.tecnicoExterno?.requiereServicioExterno ? props.incidencia.tecnicoExterno : null,
)

</script>

<template>
  <section class="bloque">
    <div class="cabecera-bloque">
      <h2><i class="pi pi-align-left" aria-hidden="true" /> Descripción del problema</h2>
      <span class="sello">Reporte inicial</span>
    </div>
    <blockquote class="descripcion">{{ incidencia.descripcion }}</blockquote>

    <div class="seccion contenedor">
      <h3>Datos generales</h3>
      <dl class="fichas">
        <div class="ficha">
          <span class="icono verde"><i class="pi pi-building" aria-hidden="true" /></span>
          <div class="texto">
            <dt>Edificio</dt>
            <dd :title="incidencia.ubicacion.edificio">{{ incidencia.ubicacion.edificio }}</dd>
          </div>
        </div>
        <div class="ficha">
          <span class="icono cian"><i class="pi pi-map-marker" aria-hidden="true" /></span>
          <div class="texto">
            <dt>Salón</dt>
            <dd :title="incidencia.ubicacion.aula">{{ incidencia.ubicacion.aula }}</dd>
          </div>
        </div>
        <div class="ficha">
          <span class="icono morado"><i class="pi pi-user" aria-hidden="true" /></span>
          <div class="texto">
            <dt>Reportante</dt>
            <dd :title="incidencia.datosReportante.nombre">
              {{ incidencia.datosReportante.nombre }}
              <small v-if="incidencia.datosReportante.perfil">({{ incidencia.datosReportante.perfil }})</small>
            </dd>
          </div>
        </div>
        <div class="ficha">
          <span class="icono turquesa"><i class="pi pi-wrench" aria-hidden="true" /></span>
          <div class="texto">
            <dt>Técnico asignado</dt>
            <dd v-if="incidencia.tecnicoAsignado" :title="incidencia.tecnicoAsignado.nombre">{{ incidencia.tecnicoAsignado.nombre }}</dd>
            <dd v-else class="sin">Sin asignar</dd>
          </div>
        </div>
        <div class="ficha">
          <span class="icono ambar"><i class="pi pi-clock" aria-hidden="true" /></span>
          <div class="texto">
            <dt>Tiempo invertido</dt>
            <dd>{{ incidencia.tiempoInvertido.texto }}</dd>
          </div>
        </div>
      </dl>
    </div>

    <div class="seccion">
      <h3>Categoría</h3>
      <div class="categoria" data-seccion="categoria">
        <div class="categoria-nombre">
          <span class="icono azul"><i class="pi pi-sitemap" aria-hidden="true" /></span>
          <strong :title="categoria?.nombre ?? incidencia.categoria">{{ categoria?.nombre ?? incidencia.categoria }}</strong>
        </div>
        <dl v-if="detalle.length" class="parametros" data-seccion="detalle">
          <div v-for="d in detalle" :key="d.clave" class="parametro">
            <dt>{{ d.etiqueta }}</dt>
            <dd>{{ d.valor }}</dd>
          </div>
        </dl>
        <p v-else class="sin-detalles">Esta categoría no tiene detalles adicionales.</p>
      </div>
    </div>

    <div v-if="incidencia.tags.length" class="seccion">
      <h3>Etiquetas</h3>
      <div class="tags">
        <EtiquetaTag v-for="t in incidencia.tags" :key="t" :texto="t" />
      </div>
    </div>

    <div v-if="externo" class="seccion">
      <h3>Proveedor externo</h3>
      <div class="externo" data-seccion="externo">
        <span class="icono-externo"><i class="pi pi-building" aria-hidden="true" /></span>
        <dl class="datos-externo">
          <div>
            <dt>Empresa</dt>
            <dd class="empresa">{{ externo.empresaProveedor }}</dd>
          </div>
          <div>
            <dt>Orden de servicio</dt>
            <dd><code>{{ externo.ordenServicioRef }}</code></dd>
          </div>
          <div v-if="externo.nombreTecnico">
            <dt>Técnico responsable</dt>
            <dd>{{ externo.nombreTecnico }}</dd>
          </div>
          <div v-if="externo.contacto">
            <dt>Contacto</dt>
            <dd>{{ externo.contacto }}</dd>
          </div>
        </dl>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cabecera-bloque {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
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
.sello {
  padding: 3px 10px;
  border-radius: 6px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 0.68rem;
  font-weight: 500;
  white-space: nowrap;
}
.descripcion {
  margin: 0;
  padding: 16px;
  background: rgba(248, 250, 252, 0.9);
  border: 1px solid rgba(226, 232, 240, 0.7);
  border-left: 4px solid #2563eb;
  border-radius: 0 12px 12px 0;
  color: #334155;
  font-size: 0.9rem;
  line-height: 1.65;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.contenedor {
  container-type: inline-size;
}
.seccion {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f1f5f9;
}
h3 {
  margin: 0 0 12px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #94a3b8;
}
dl,
dd {
  margin: 0;
}

/* Fichas con icono de color */
.fichas {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}
/* 5 fichas que llenan el ancho: 3 arriba y 2 abajo (y se acomodan en 2 o 1 columna si falta espacio). */
.ficha {
  grid-column: span 2;
}
.ficha:nth-child(n + 4) {
  grid-column: span 3;
}
@container (max-width: 640px) {
  .ficha,
  .ficha:nth-child(n + 4) {
    grid-column: span 3;
  }
  .ficha:last-child {
    grid-column: span 6;
  }
}
@container (max-width: 380px) {
  .ficha,
  .ficha:nth-child(n + 4) {
    grid-column: span 6;
  }
}
.ficha {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
  padding: 14px;
  background: rgba(248, 250, 252, 0.7);
  border: 1px solid rgba(226, 232, 240, 0.85);
  border-radius: 12px;
}
.icono {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  font-size: 0.9rem;
}
.icono.azul { background: rgba(219, 234, 254, 0.8); color: #1d4ed8; }
.icono.verde { background: rgba(209, 250, 229, 0.8); color: #047857; }
.icono.morado { background: rgba(243, 232, 255, 0.8); color: #7e22ce; }
.icono.cian { background: rgba(207, 250, 254, 0.8); color: #0e7490; }
.icono.turquesa { background: rgba(204, 251, 241, 0.8); color: #0f766e; }
.icono.ambar { background: rgba(254, 243, 199, 0.8); color: #b45309; }
.texto {
  min-width: 0;
}
dt {
  font-size: 0.7rem;
  font-weight: 500;
  color: #94a3b8;
}
.ficha dd {
  margin-top: 1px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #1e293b;
  overflow-wrap: anywhere;
}
.ficha dd small {
  font-weight: 400;
  color: #94a3b8;
}
.sin {
  color: #94a3b8 !important;
  font-weight: 500 !important;
}

/* Categoría: el nombre arriba y, dentro, sus detalles aprovechando todo el ancho */
.categoria {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  background: rgba(248, 250, 252, 0.7);
  border: 1px solid rgba(226, 232, 240, 0.85);
  border-radius: 12px;
}
.categoria-nombre {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.categoria-nombre strong {
  min-width: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
  overflow-wrap: anywhere;
}
.sin-detalles {
  margin: 0;
  font-size: 0.8rem;
  color: #94a3b8;
}
.parametros {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: 12px;
}
.parametro {
  min-width: 0;
  padding: 12px 16px;
  background: #fff;
  border: 1px solid rgba(226, 232, 240, 0.85);
  border-radius: 12px;
}
.parametro dd {
  margin-top: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #0f172a;
  overflow-wrap: anywhere;
}

/* Etiquetas */
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

/* Proveedor externo */
.externo {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: linear-gradient(90deg, rgba(239, 246, 255, 0.6), #f8fafc 55%, #fff);
  border: 1px solid #dbeafe;
  border-radius: 12px;
}
.icono-externo {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #2563eb;
  color: #fff;
  font-size: 1.05rem;
}
.datos-externo {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));
  gap: 10px 20px;
  flex: 1;
  min-width: 0;
}
.datos-externo div {
  min-width: 0;
}
.datos-externo dd {
  margin-top: 2px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #1e293b;
  overflow-wrap: anywhere;
}
.datos-externo .empresa {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
}
code {
  padding: 1px 6px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background: #fff;
  font-family: ui-monospace, 'JetBrains Mono', 'Cascadia Mono', Consolas, monospace;
  font-size: 0.78rem;
  font-weight: 600;
}
</style>
