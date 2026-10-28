<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import logo from '@/assets/img/logo-utm.png'
import { useSesionStore } from '@/core/auth/sesion.store'
import { aviso } from '@/core/http/avisos'
import { aMapa, mensajeError } from '@/core/http/errores'
import { rutaInicio } from '@/core/router/inicio'
import { sinAcentos } from '@/core/utils/validacion'
import CampoError from '@/shared/components/CampoError.vue'
import { login } from '../api/auth.api'

const router = useRouter()
const route = useRoute()
const sesion = useSesionStore()

const form = reactive({ usuario: '', password: '' })
const verPassword = ref(false)
const cargando = ref(false)
const mensaje = ref('')
const errores = ref<Record<string, string>>({})

const puedeEnviar = computed(() => !!form.usuario.trim() && !!form.password && !cargando.value)

/** Solo se acepta un redirect interno (evita redirigir a otro sitio). */
function destino(): string {
  const r = route.query.redirect
  if (typeof r === 'string' && r !== '/' && r.startsWith('/') && !r.startsWith('//')) return r
  return rutaInicio(router, sesion.rol)
}

async function entrar() {
  if (!puedeEnviar.value) return
  cargando.value = true
  mensaje.value = ''
  errores.value = {}
  try {
    sesion.login(await login(sinAcentos(form.usuario.trim()), form.password))
    await router.replace(destino())
  } catch (e) {
    errores.value = aMapa(e)
    aviso('error', 'No se pudo iniciar sesión', mensajeError(e))
    form.password = ''
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <main class="pagina">
    <div class="brillo b1" />
    <div class="brillo b2" />
    <div class="brillo b3" />

    <div class="columna">
      <div class="tarjeta">
        <div class="franja" />

        <header class="cabecera">
          <img :src="logo" alt="Universidad Tecnológica Metropolitana" class="logo" />
          <span class="eyebrow"><i class="punto" />Portal Institucional</span>
          <h1>Bienvenidos</h1>
          <p>Universidad Tecnológica Metropolitana</p>
        </header>

        <form class="formulario" novalidate @submit.prevent="entrar">
          <div class="campo">
            <div class="etiqueta">
              <label for="usuario">Usuario</label>
              <span>Nombre de usuario</span>
            </div>
            <div class="entrada">
              <i class="pi pi-user icono" />
              <input
                id="usuario"
                v-model="form.usuario"
                type="text"
                autocomplete="username"
                placeholder="Ej. nombre.apellido"
                :aria-invalid="!!errores.usuario"
              />
            </div>
            <CampoError :mensaje="errores.usuario" />
          </div>

          <div class="campo">
            <div class="etiqueta">
              <label for="password">Contraseña</label>
            </div>
            <div class="entrada">
              <i class="pi pi-lock icono" />
              <input
                id="password"
                v-model="form.password"
                :type="verPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="••••••••••••"
                :aria-invalid="!!errores.password"
              />
              <button
                type="button"
                class="ojo"
                :aria-label="verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                @click="verPassword = !verPassword"
              >
                <i :class="verPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" />
              </button>
            </div>
            <CampoError :mensaje="errores.password" />
          </div>

          <div v-if="mensaje" class="estado error" role="alert">
            <i class="pi pi-exclamation-circle" />
            <span>{{ mensaje }}</span>
          </div>

          <button type="submit" class="boton" :disabled="!puedeEnviar">
            <template v-if="cargando">
              <i class="pi pi-spin pi-spinner" />
              <span>Autenticando...</span>
            </template>
            <template v-else>
              <span>Iniciar sesión</span>
              <i class="pi pi-arrow-right flecha" />
            </template>
          </button>
        </form>

        <footer class="pie">
          <p>UTM Desk • Mérida</p>
        </footer>
      </div>

      <div class="cifrado">
        <i class="pi pi-shield" />
        <span>Conexión cifrada de alta seguridad institucional</span>
      </div>
    </div>
  </main>
</template>

<style scoped>
.pagina {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  overflow: hidden;
  background: var(--surface);
}
.brillo {
  position: absolute;
  border-radius: 50%;
  filter: blur(64px);
  pointer-events: none;
}
.b1 { top: -8rem; left: -8rem; width: 24rem; height: 24rem; background: rgba(211, 228, 254, 0.6); }
.b2 { top: 50%; right: -10rem; width: 30rem; height: 30rem; background: rgba(229, 238, 255, 0.8); }
.b3 { bottom: -6rem; left: 33%; width: 20rem; height: 20rem; background: rgba(216, 226, 255, 0.4); }

.columna {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.tarjeta {
  position: relative;
  width: 100%;
  background: var(--card);
  border-radius: 12px;
  box-shadow: 0 20px 40px -12px rgba(75, 95, 127, 0.18);
  padding: 32px;
  display: flex;
  flex-direction: column;
}
.franja {
  position: absolute;
  inset: 0 0 auto 0;
  height: 6px;
  border-radius: 12px 12px 0 0;
  background: linear-gradient(90deg, var(--accent-soft), var(--tint), var(--accent-soft));
}

.cabecera {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin: 8px 0 24px;
}
.logo {
  width: 150px;
  height: auto;
  margin-bottom: 16px;
}
.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--secondary);
}
.punto {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--secondary);
}
h1 {
  margin: 0 0 4px;
  font-family: var(--font-head);
  font-size: 2rem;
  line-height: 2.5rem;
  letter-spacing: -0.025em;
  font-weight: 650;
}
.cabecera p {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--on-surface-variant);
}

.formulario {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.campo {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.etiqueta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.etiqueta label {
  font-size: 0.875rem;
  font-weight: 600;
}
.etiqueta span {
  font-size: 0.75rem;
  color: rgba(68, 71, 77, 0.7);
}
.entrada {
  position: relative;
  display: flex;
  align-items: center;
}
.icono {
  position: absolute;
  left: 16px;
  color: var(--on-surface-variant);
  pointer-events: none;
  transition: color 0.15s;
}
.entrada:focus-within .icono {
  color: var(--accent-soft);
}
input {
  width: 100%;
  padding: 10px 44px;
  font: inherit;
  font-size: 1rem;
  color: var(--on-surface);
  background: var(--card);
  border: 1px solid var(--outline-variant);
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.15s, border-color 0.15s;
}
input::placeholder {
  color: rgba(68, 71, 77, 0.4);
}
input:focus {
  outline: none;
  border-color: var(--accent-soft);
  box-shadow: 0 0 0 3px rgba(65, 135, 251, 0.3);
}
input[aria-invalid='true'] {
  border-color: var(--error);
}
.ojo {
  position: absolute;
  right: 8px;
  display: flex;
  padding: 6px;
  border: 0;
  border-radius: 4px;
  background: none;
  color: var(--on-surface-variant);
  cursor: pointer;
}
.ojo:hover {
  background: var(--surface-low);
  color: var(--on-surface);
}

.estado {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 0.875rem;
}
.estado.error {
  background: var(--error-container);
  color: var(--on-error-container);
}

.boton {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  margin-top: 4px;
  padding: 10px 24px;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #fff;
  background: var(--accent);
  border: 0;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.1s, opacity 0.2s;
}
.boton:hover:not(:disabled) {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.15);
}
.boton:hover:not(:disabled) .flecha {
  transform: translateX(4px);
}
.boton:active:not(:disabled) {
  transform: scale(0.99);
}
.boton:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.flecha {
  transition: transform 0.2s;
}
.boton:focus-visible {
  outline: 2px solid var(--accent-soft);
  outline-offset: 2px;
}

.pie {
  margin-top: 24px;
  text-align: center;
}
.pie p {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 500;
  color: rgba(68, 71, 77, 0.6);
}
.cifrado {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 16px;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(68, 71, 77, 0.7);
}
.cifrado .pi {
  color: var(--secondary);
}

@media (max-width: 480px) {
  .tarjeta { padding: 24px 20px; }
  h1 { font-size: 1.625rem; line-height: 2.125rem; }
}
</style>
