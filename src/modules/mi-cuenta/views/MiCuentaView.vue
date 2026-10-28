<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Password from 'primevue/password'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import { ETIQUETA_ROL } from '@/core/auth/permisos'
import { usePermisos } from '@/core/auth/usePermisos'
import { LIMITES } from '@/core/utils/validacion'
import CampoFormulario from '@/shared/components/CampoFormulario.vue'
import { useMiPassword } from '../composables/useMiPassword'
import { useMiPerfil } from '../composables/useMiPerfil'

const route = useRoute()
const router = useRouter()
const { usuario, rol } = usePermisos()

// La pestaña vive en la URL (?tab=password) para poder enlazarla y para que "atrás" funcione.
const pestana = computed(() => (route.query.tab === 'password' ? 'password' : 'perfil'))
const cambiarPestana = (v: string | number) =>
  router.replace({ query: v === 'password' ? { tab: 'password' } : {} })

const perfil = useMiPerfil()
const pass = useMiPassword()

const iniciales = computed(() => {
  const partes = (usuario.value?.nombreCompleto ?? '').trim().split(/\s+/).filter(Boolean)
  return ((partes[0]?.[0] ?? '') + (partes.length > 1 ? partes[partes.length - 1]![0] : '')).toUpperCase() || '?'
})
const activa = computed(() => /activ/i.test(perfil.cuenta.estado ?? '') && !/inactiv/i.test(perfil.cuenta.estado ?? ''))

const enfocarError = () =>
  requestAnimationFrame(() => document.querySelector<HTMLElement>('.invalido input')?.focus())
async function guardarPerfil() {
  if (!(await perfil.guardar())) enfocarError()
}
async function guardarPassword() {
  if (!(await pass.guardar())) enfocarError()
}
</script>

<template>
  <section>
    <div class="pagina-titulo">
      <h1>Mi cuenta</h1>
      <p>Actualiza tus datos y tu contraseña.</p>
    </div>

    <div class="tarjeta-base contenedor">
      <header class="resumen">
        <span class="avatar" aria-hidden="true">{{ iniciales }}</span>
        <div class="quien">
          <span class="nombre una-linea" :title="usuario?.nombreCompleto">{{ usuario?.nombreCompleto }}</span>
          <small class="una-linea">@{{ usuario?.usuario }} · {{ rol ? ETIQUETA_ROL[rol] : '' }}</small>
        </div>
      </header>

      <Tabs :value="pestana" @update:value="cambiarPestana">
        <TabList>
          <Tab value="perfil" data-tab="perfil"><i class="pi pi-user" aria-hidden="true" /> Perfil</Tab>
          <Tab value="password" data-tab="password"><i class="pi pi-key" aria-hidden="true" /> Contraseña</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="perfil">
            <div class="cols">
              <form class="formulario" novalidate @submit.prevent="guardarPerfil">
                <Message v-if="perfil.mensaje.value" severity="error" :closable="false" class="mensaje">{{ perfil.mensaje.value }}</Message>
                <Message v-if="perfil.faltaDesglose.value" severity="info" :closable="false">
                  Tu sesión es anterior a esta pantalla y no trae tu nombre por partes: escríbelo y guarda (o vuelve a iniciar sesión).
                </Message>
                <CampoFormulario id="mp-nombres" etiqueta="Nombres" requerido :error="perfil.errores.value.nombres" :contador="{ actual: perfil.form.nombres.length, max: LIMITES.nombres.max }">
                  <InputText id="mp-nombres" v-model="perfil.form.nombres" :maxlength="LIMITES.nombres.max" autocomplete="given-name" :invalid="!!perfil.errores.value.nombres" :disabled="perfil.enviando.value || perfil.cargando.value" fluid />
                </CampoFormulario>
                <div class="dos">
                  <CampoFormulario id="mp-paterno" etiqueta="Apellido paterno" requerido :error="perfil.errores.value.apellidoPaterno" :contador="{ actual: perfil.form.apellidoPaterno.length, max: LIMITES.apellidoPaterno.max }">
                    <InputText id="mp-paterno" v-model="perfil.form.apellidoPaterno" :maxlength="LIMITES.apellidoPaterno.max" autocomplete="family-name" :invalid="!!perfil.errores.value.apellidoPaterno" :disabled="perfil.enviando.value || perfil.cargando.value" fluid />
                  </CampoFormulario>
                  <CampoFormulario id="mp-materno" etiqueta="Apellido materno" opcional :error="perfil.errores.value.apellidoMaterno" :contador="{ actual: perfil.form.apellidoMaterno.length, max: LIMITES.apellidoMaterno.max }">
                    <InputText id="mp-materno" v-model="perfil.form.apellidoMaterno" :maxlength="LIMITES.apellidoMaterno.max" :invalid="!!perfil.errores.value.apellidoMaterno" :disabled="perfil.enviando.value || perfil.cargando.value" fluid />
                  </CampoFormulario>
                </div>
                <CampoFormulario id="mp-correo" etiqueta="Correo" requerido :error="perfil.errores.value.correo" :contador="{ actual: perfil.form.correo.length, max: LIMITES.correo.max }">
                  <InputText id="mp-correo" v-model="perfil.form.correo" type="email" :maxlength="LIMITES.correo.max" autocomplete="email" :invalid="!!perfil.errores.value.correo" :disabled="perfil.enviando.value || perfil.cargando.value" fluid />
                </CampoFormulario>
                <div class="botones">
                  <Button type="submit" label="Guardar cambios" icon="pi pi-check" :loading="perfil.enviando.value" :disabled="!perfil.hayCambios.value || perfil.cargando.value" />
                </div>
              </form>

              <aside class="cuenta" aria-label="Datos de la cuenta (solo lectura)">
                <h3><i class="pi pi-lock" aria-hidden="true" /> Datos de la cuenta</h3>
                <p class="sub">Bloqueados: los administra Soporte de TI</p>
                <dl class="datos">
                  <div class="dato">
                    <dt>Usuario</dt>
                    <dd class="caja mono"><span class="una-linea">{{ perfil.cuenta.usuario || '—' }}</span><i class="pi pi-lock" aria-hidden="true" /></dd>
                  </div>
                  <div class="dato">
                    <dt>Rol</dt>
                    <dd class="caja"><span class="una-linea">{{ perfil.cuenta.rol || '—' }}</span></dd>
                  </div>
                  <div class="dato">
                    <dt>Clasificación</dt>
                    <dd class="caja"><span class="una-linea">{{ perfil.cuenta.clasificacion || '—' }}</span></dd>
                  </div>
                  <div class="dato">
                    <dt>Estado de la cuenta</dt>
                    <dd class="caja">
                      <span class="punto" :class="{ ok: activa }" aria-hidden="true" />
                      <span class="una-linea">{{ perfil.cuenta.estado || '—' }}</span>
                    </dd>
                  </div>
                  <div class="dato">
                    <dt>Cuenta creada</dt>
                    <dd class="caja"><i class="pi pi-calendar" aria-hidden="true" /><span class="una-linea">{{ perfil.cuenta.creada || '—' }}</span></dd>
                  </div>
                </dl>
                <p class="nota">Tu usuario, rol y clasificación solo los puede cambiar Soporte de TI.</p>
              </aside>
            </div>
          </TabPanel>

          <TabPanel value="password">
            <form class="formulario angosto" novalidate @submit.prevent="guardarPassword">
              <Message v-if="pass.mensaje.value" severity="error" :closable="false" class="mensaje">{{ pass.mensaje.value }}</Message>
              <CampoFormulario id="pw-actual" etiqueta="Contraseña actual" requerido :error="pass.errores.value.passwordActual">
                <Password v-model="pass.form.passwordActual" input-id="pw-actual" :feedback="false" toggle-mask :maxlength="LIMITES.password.max" autocomplete="current-password" :invalid="!!pass.errores.value.passwordActual" :disabled="pass.enviando.value" fluid />
              </CampoFormulario>
              <CampoFormulario id="pw-nueva" etiqueta="Nueva contraseña" requerido :error="pass.errores.value.nuevaPassword" :ayuda="`Mínimo ${LIMITES.password.min} caracteres.`">
                <Password v-model="pass.form.nuevaPassword" input-id="pw-nueva" :feedback="false" toggle-mask :maxlength="LIMITES.password.max" autocomplete="new-password" :invalid="!!pass.errores.value.nuevaPassword" :disabled="pass.enviando.value" fluid />
              </CampoFormulario>
              <CampoFormulario id="pw-confirmar" etiqueta="Confirmar nueva contraseña" requerido :error="pass.errores.value.confirmacion">
                <Password v-model="pass.form.confirmacion" input-id="pw-confirmar" :feedback="false" toggle-mask :maxlength="LIMITES.password.max" autocomplete="new-password" :invalid="!!pass.errores.value.confirmacion" :disabled="pass.enviando.value" fluid />
              </CampoFormulario>
              <div class="botones">
                <Button type="submit" label="Cambiar contraseña" icon="pi pi-key" :loading="pass.enviando.value" />
              </div>
            </form>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  </section>
</template>

<style scoped>
.contenedor {
  max-width: none;
  width: 100%;
}
.resumen {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 12px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--outline-variant);
  min-width: 0;
}
.avatar {
  flex: none;
  display: grid;
  place-items: center;
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 16px;
  background: #2563eb;
  color: #fff;
  font-weight: 700;
  font-size: 1.15rem;
  letter-spacing: 0.02em;
}
.quien {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.nombre {
  font-weight: 700;
  font-size: 1.1rem;
}
.quien small {
  color: var(--on-surface-variant);
}
:deep(.p-tab) {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.cols {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
  gap: 24px;
  padding-top: 8px;
  align-items: start;
}
.formulario {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 8px;
}
.formulario.angosto {
  max-width: 36rem;
}
.dos {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.cuenta {
  padding: 16px;
  background: var(--surface-low);
  border: 1px solid var(--outline-variant);
  border-radius: 14px;
  margin-top: 8px;
}
.cuenta h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 0.95rem;
}
.sub {
  margin: 2px 0 14px;
  color: var(--on-surface-variant);
  font-size: 0.8rem;
}
.datos {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
}
.dato {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.dato dt {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--on-surface-variant);
}
.caja {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 8px 12px;
  min-width: 0;
  border: 1px solid var(--outline-variant);
  border-radius: 10px;
  background: color-mix(in srgb, var(--outline-variant) 25%, transparent);
  font-size: 0.9rem;
}
.caja .una-linea {
  flex: 1;
  min-width: 0;
}
.caja i {
  color: var(--on-surface-variant);
  font-size: 0.8rem;
}
.mono .una-linea {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.punto {
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--on-surface-variant);
}
.punto.ok {
  background: #16a34a;
}
.nota {
  margin: 14px 0 0;
  color: var(--on-surface-variant);
  font-size: 0.8rem;
  font-style: italic;
}
.botones {
  display: flex;
  justify-content: flex-end;
}
.mensaje :deep(.p-message-text) {
  overflow-wrap: anywhere;
}
@media (max-width: 860px) {
  .cols {
    grid-template-columns: minmax(0, 1fr);
  }
}
@media (max-width: 480px) {
  .dos {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
