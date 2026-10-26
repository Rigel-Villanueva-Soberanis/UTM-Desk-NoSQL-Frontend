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

const datosBloqueados = computed(() => {
  const c = perfil.cuenta
  return [
    { id: 'mc-usuario', etiqueta: 'Usuario', valor: c.usuario },
    { id: 'mc-rol', etiqueta: 'Rol', valor: c.rol },
    { id: 'mc-clasificacion', etiqueta: 'Clasificación', valor: c.clasificacion },
    { id: 'mc-estado', etiqueta: 'Estado de la cuenta', valor: c.estado },
    { id: 'mc-creada', etiqueta: 'Cuenta creada', valor: c.creada },
  ]
})

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
      <div class="resumen">
        <span class="nombre una-linea" :title="usuario?.nombreCompleto">{{ usuario?.nombreCompleto }}</span>
        <small class="una-linea">
          @{{ usuario?.usuario }} · {{ rol ? ETIQUETA_ROL[rol] : '' }}<template v-if="usuario?.clasificacion"> · {{ usuario.clasificacion }}</template>
        </small>
      </div>

      <Tabs :value="pestana" @update:value="cambiarPestana">
        <TabList>
          <Tab value="perfil" data-tab="perfil">Perfil</Tab>
          <Tab value="password" data-tab="password">Contraseña</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="perfil">
            <form class="formulario" novalidate @submit.prevent="guardarPerfil">
              <Message v-if="perfil.mensaje.value" severity="error" :closable="false" class="mensaje">{{ perfil.mensaje.value }}</Message>
              <Message v-if="perfil.faltaDesglose.value" severity="info" :closable="false">
                Tu sesión es anterior a esta pantalla y no trae tu nombre por partes: escríbelo y guarda (o vuelve a iniciar sesión).
              </Message>
              <CampoFormulario id="mp-nombres" etiqueta="Nombres" requerido :error="perfil.errores.value.nombres" :contador="{ actual: perfil.form.nombres.length, max: LIMITES.nombres.max }">
                <InputText id="mp-nombres" v-model="perfil.form.nombres" :maxlength="LIMITES.nombres.max" autocomplete="given-name" :invalid="!!perfil.errores.value.nombres" :disabled="perfil.enviando.value || perfil.cargando.value" fluid />
              </CampoFormulario>
              <CampoFormulario id="mp-paterno" etiqueta="Apellido paterno" requerido :error="perfil.errores.value.apellidoPaterno" :contador="{ actual: perfil.form.apellidoPaterno.length, max: LIMITES.apellidoPaterno.max }">
                <InputText id="mp-paterno" v-model="perfil.form.apellidoPaterno" :maxlength="LIMITES.apellidoPaterno.max" autocomplete="family-name" :invalid="!!perfil.errores.value.apellidoPaterno" :disabled="perfil.enviando.value || perfil.cargando.value" fluid />
              </CampoFormulario>
              <CampoFormulario id="mp-materno" etiqueta="Apellido materno" opcional :error="perfil.errores.value.apellidoMaterno" :contador="{ actual: perfil.form.apellidoMaterno.length, max: LIMITES.apellidoMaterno.max }">
                <InputText id="mp-materno" v-model="perfil.form.apellidoMaterno" :maxlength="LIMITES.apellidoMaterno.max" :invalid="!!perfil.errores.value.apellidoMaterno" :disabled="perfil.enviando.value || perfil.cargando.value" fluid />
              </CampoFormulario>
              <CampoFormulario id="mp-correo" etiqueta="Correo" requerido :error="perfil.errores.value.correo" :contador="{ actual: perfil.form.correo.length, max: LIMITES.correo.max }">
                <InputText id="mp-correo" v-model="perfil.form.correo" type="email" :maxlength="LIMITES.correo.max" autocomplete="email" :invalid="!!perfil.errores.value.correo" :disabled="perfil.enviando.value || perfil.cargando.value" fluid />
              </CampoFormulario>
              <section class="cuenta" aria-label="Datos de la cuenta (solo lectura)">
                <h3><i class="pi pi-lock" aria-hidden="true" /> Datos de la cuenta <small>Bloqueados: los administra Soporte de TI</small></h3>
                <div class="rejilla">
                  <div v-for="d in datosBloqueados" :key="d.id" class="bloq">
                    <label :for="d.id">{{ d.etiqueta }}</label>
                    <InputText :id="d.id" :model-value="d.valor || '—'" disabled readonly fluid />
                  </div>
                </div>
              </section>
              <p class="nota">Tu usuario, rol y clasificación solo los puede cambiar Soporte de TI.</p>
              <div class="botones">
                <Button type="submit" label="Guardar cambios" icon="pi pi-check" :loading="perfil.enviando.value" :disabled="!perfil.hayCambios.value || perfil.cargando.value" />
              </div>
            </form>
          </TabPanel>

          <TabPanel value="password">
            <form class="formulario" novalidate @submit.prevent="guardarPassword">
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
  max-width: 40rem;
}
.resumen {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 12px;
  min-width: 0;
}
.nombre {
  font-weight: 700;
  font-size: 1.1rem;
}
.resumen small {
  color: var(--on-surface-variant);
}
.formulario {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 8px;
}
.nota {
  margin: 0;
  color: var(--on-surface-variant);
  font-size: 0.85rem;
}
.cuenta {
  padding: 14px 16px;
  background: var(--surface-low);
  border: 1px dashed var(--outline-variant);
  border-radius: 12px;
}
.cuenta h3 {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px;
  margin: 0 0 12px;
  font-size: 0.9rem;
}
.cuenta h3 small {
  font-weight: 400;
  color: var(--on-surface-variant);
}
.rejilla {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
}
.bloq {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.bloq label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--on-surface-variant);
}
@media (max-width: 560px) {
  .rejilla {
    grid-template-columns: minmax(0, 1fr);
  }
}
.botones {
  display: flex;
  justify-content: flex-end;
}
.mensaje :deep(.p-message-text) {
  overflow-wrap: anywhere;
}
</style>
