<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import logo from '@/assets/img/logo-utm.png'
import { ETIQUETA_ROL } from '@/core/auth/permisos'
import { useSesionStore } from '@/core/auth/sesion.store'
import { reiniciarCatalogos } from '@/modules/catalogos/composables/useCatalogos'
import AppMenu from './AppMenu.vue'
import { reiniciarContadores } from './useContadores'

const sesion = useSesionStore()
const router = useRouter()
const route = useRoute()

const CLAVE = 'utmdesk.menuColapsado'
const leer = () => {
  try {
    return localStorage.getItem(CLAVE) === '1'
  } catch {
    return false
  }
}
/** Pantallas anchas: el menú se pliega a solo iconos. Celular: el menú es un cajón que se abre encima. */
const colapsado = ref(leer())
const abierto = ref(false)
const esCelular = () => window.matchMedia('(max-width: 768px)').matches

function alternar() {
  if (esCelular()) {
    abierto.value = !abierto.value
    return
  }
  colapsado.value = !colapsado.value
  try {
    localStorage.setItem(CLAVE, colapsado.value ? '1' : '0')
  } catch {
    /* sin almacenamiento: solo vale para esta sesión */
  }
}
const cerrarCajon = () => (abierto.value = false)
watch(() => route.fullPath, cerrarCajon)
const alTeclear = (e: KeyboardEvent) => {
  if (e.key === 'Escape') cerrarCajon()
}
onMounted(() => window.addEventListener('keydown', alTeclear))
onBeforeUnmount(() => window.removeEventListener('keydown', alTeclear))

const iniciales = computed(() => {
  const p = (sesion.usuario?.nombreCompleto ?? '').trim().split(/\s+/).filter(Boolean)
  return ((p[0]?.[0] ?? '') + (p.length > 1 ? (p[p.length - 1]?.[0] ?? '') : '')).toUpperCase() || '?'
})
const rolTexto = computed(() => {
  const u = sesion.usuario
  if (!u) return ''
  return ETIQUETA_ROL[u.rol] + (u.clasificacion ? ` · ${u.clasificacion}` : '')
})

function salir() {
  sesion.logout()
  reiniciarCatalogos()
  reiniciarContadores()
  router.replace({ name: 'login' })
}
</script>

<template>
  <div class="app" :class="{ colapsado }">
    <div v-if="abierto" class="velo" aria-hidden="true" @click="cerrarCajon" />

    <aside class="lateral" :class="{ abierto }" aria-label="Barra lateral">
      <div class="cuerpo">
        <AppMenu :colapsado="colapsado" @navegar="cerrarCajon" />
      </div>

      <RouterLink v-if="sesion.usuario" to="/mi-cuenta" class="perfil" title="Mi cuenta">
        <span class="avatar">
          {{ iniciales }}
          <span class="punto" aria-hidden="true" />
        </span>
        <span class="datos">
          <strong class="una-linea" :title="sesion.usuario.nombreCompleto">{{ sesion.usuario.nombreCompleto }}</strong>
          <small class="una-linea" :title="rolTexto">{{ rolTexto }}</small>
        </span>
        <i class="pi pi-cog ajustes" aria-hidden="true" />
      </RouterLink>
    </aside>

    <div class="principal">
      <header class="barra">
        <Button
          class="alternar"
          :icon="colapsado ? 'pi pi-angle-double-right' : 'pi pi-bars'"
          severity="secondary"
          text
          rounded
          :aria-label="colapsado ? 'Desplegar menú' : 'Plegar menú'"
          :aria-expanded="abierto || !colapsado"
          data-accion="alternar-menu"
          @click="alternar"
        />
        <img :src="logo" alt="Universidad Tecnológica de la Mixteca" class="logo-barra" />
        <div class="espacio" />
        <Button label="Cerrar sesión" icon="pi pi-sign-out" severity="secondary" text size="small" @click="salir" />
      </header>
      <main class="contenido">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  height: 100%;
  overflow: hidden;
  --ancho-menu: 256px;
}
.app.colapsado {
  --ancho-menu: 76px;
}

/* ───── Barra lateral oscura ───── */
.lateral {
  width: var(--ancho-menu);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: #0c2340;
  border-right: 1px solid rgba(30, 41, 59, 0.8);
  box-shadow: 0 0 24px rgba(8, 20, 40, 0.25);
  z-index: 30;
  transition: width 0.2s ease;
}
.logo-barra {
  height: 60px;
  width: auto;
  flex-shrink: 0;
}
.cuerpo {
  padding-top: 16px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

/* Tarjeta de usuario (lleva a Mi cuenta) */
.perfil {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  padding: 14px 16px;
  background: #091b32;
  border-top: 1px solid rgba(71, 85, 105, 0.6);
  color: #f1f5f9;
  text-decoration: none;
  transition: background 0.15s;
}
.perfil:hover {
  background: #0d2744;
}
.avatar {
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #334155;
  border: 2px solid #475569;
  font-size: 0.75rem;
  font-weight: 700;
  color: #fff;
}
.punto {
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #10b981;
  border: 2px solid #091b32;
}
.datos {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}
.datos strong {
  font-size: 0.8rem;
  font-weight: 600;
}
.datos small {
  font-size: 0.72rem;
  color: #94a3b8;
}
.ajustes {
  color: #94a3b8;
}

/* ───── Contenido ───── */
.principal {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--surface);
}
.barra {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 76px;
  flex-shrink: 0;
  padding: 0 24px;
  background: var(--card);
  border-bottom: 1px solid #e2e8f0;
}
.espacio {
  flex: 1;
}
/* Ocupa todo el ancho disponible (sin tope), con aire alrededor. */
.contenido {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 24px 16px;
}
.velo {
  display: none;
}

/* ───── Menú plegado (pantallas anchas) ───── */
@media (min-width: 769px) {
  /* Elementos del menú (componente hijo): solo iconos; el nombre sale como tooltip y la insignia pasa a la esquina. */
  .app.colapsado :deep(.texto) {
    display: none;
  }
  .app.colapsado :deep(.menu) {
    padding: 0 10px;
  }
  .app.colapsado :deep(.opcion),
  .app.colapsado :deep(.menu .destacado) {
    justify-content: center;
    padding-inline: 0;
  }
  .app.colapsado :deep(.insignia) {
    position: absolute;
    top: 2px;
    right: 4px;
    min-width: 18px;
    padding: 0 5px;
    font-size: 0.62rem;
  }
  .app.colapsado .datos,
  .app.colapsado .ajustes {
    display: none;
  }
  .app.colapsado .perfil {
    justify-content: center;
    padding-inline: 0;
  }
}

/* ───── Celular: el menú es un cajón encima del contenido ───── */
@media (max-width: 768px) {
  .lateral {
    position: fixed;
    inset: 0 auto 0 0;
    width: 272px;
    max-width: 86vw;
    transform: translateX(-100%);
    transition: transform 0.2s;
  }
  .lateral.abierto {
    transform: none;
  }
  .velo {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 25;
    background: rgba(8, 20, 40, 0.5);
  }
  .barra {
    padding: 0 12px;
  }
  .contenido {
    padding: 16px;
  }
}
</style>
