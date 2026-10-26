<script setup lang="ts">
import { computed, ref } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Password from 'primevue/password'
import Select from 'primevue/select'
import Skeleton from 'primevue/skeleton'
import { LIMITES } from '@/core/utils/validacion'
import CampoFormulario from '@/shared/components/CampoFormulario.vue'
import NoEncontrado from '@/shared/components/NoEncontrado.vue'
import PantallaVacia from '@/shared/components/PantallaVacia.vue'
import { useFormUsuario } from '../composables/useFormUsuario'
import { ESTADOS_CUENTA } from '../types/usuario.types'
import { generarPassword } from '../utils/password'

const props = defineProps<{ id?: string }>()
const idRef = computed(() => props.id)
const {
  editando, form, errores, mensaje, enviando, cargando, cargandoCatalogos, errorCatalogos, errorCarga, mensajeCarga,
  roles, clasificaciones, requiereClasificacion, muestraClasificacion, esMiCuenta, hayCambios,
  guardar, volver, reintentar, recargarCatalogos,
} = useFormUsuario(idRef)

const verPassword = ref(false)
function generar() {
  form.password = generarPassword()
  verPassword.value = true
}

async function enviar() {
  const ok = await guardar()
  if (!ok) {
    // Lleva el foco al primer campo con error.
    requestAnimationFrame(() => document.querySelector<HTMLElement>('.invalido input, .invalido .p-select')?.focus())
  }
}
</script>

<template>
  <NoEncontrado v-if="errorCarga === 'no-encontrado'" titulo="Usuario no encontrado" texto="El usuario no existe o ya fue eliminado." />

  <section v-else>
    <div class="pagina-titulo">
      <h1>{{ editando ? 'Editar usuario' : 'Nuevo usuario' }}</h1>
      <p>{{ editando ? 'Actualiza los datos de la cuenta.' : 'Crea una cuenta para una persona del sistema.' }}</p>
    </div>

    <div v-if="errorCarga === 'otro'" class="tarjeta-base">
      <PantallaVacia icono="pi pi-exclamation-triangle" titulo="No se pudo cargar el usuario" :texto="mensajeCarga">
        <Button label="Reintentar" icon="pi pi-refresh" severity="secondary" @click="reintentar" />
      </PantallaVacia>
    </div>

    <div v-else-if="errorCatalogos" class="tarjeta-base">
      <PantallaVacia icono="pi pi-exclamation-triangle" titulo="No se pudieron cargar los roles" :texto="errorCatalogos">
        <Button label="Reintentar" icon="pi pi-refresh" severity="secondary" @click="recargarCatalogos" />
      </PantallaVacia>
    </div>

    <div v-else-if="cargando || cargandoCatalogos" class="tarjeta-base formulario" aria-busy="true" data-esqueleto>
      <Skeleton v-for="n in 4" :key="n" height="3.2rem" />
    </div>

    <form v-else class="tarjeta-base formulario" novalidate @submit.prevent="enviar">
      <Message v-if="mensaje" severity="error" :closable="false" class="mensaje">{{ mensaje }}</Message>
      <Message v-if="esMiCuenta" severity="info" :closable="false">
        Es tu propia cuenta: no puedes cambiar tu rol ni su estado para no quedarte sin acceso.
      </Message>

      <fieldset :disabled="cargando || enviando" class="grupo">
        <legend>Datos personales</legend>
        <div class="rejilla">
          <CampoFormulario id="u-nombres" etiqueta="Nombres" requerido :error="errores.nombres" :contador="{ actual: form.nombres.length, max: LIMITES.nombres.max }">
            <InputText id="u-nombres" v-model="form.nombres" :maxlength="LIMITES.nombres.max" autocomplete="off" :invalid="!!errores.nombres" fluid />
          </CampoFormulario>
          <CampoFormulario id="u-paterno" etiqueta="Apellido paterno" requerido :error="errores.apellidoPaterno" :contador="{ actual: form.apellidoPaterno.length, max: LIMITES.apellidoPaterno.max }">
            <InputText id="u-paterno" v-model="form.apellidoPaterno" :maxlength="LIMITES.apellidoPaterno.max" autocomplete="off" :invalid="!!errores.apellidoPaterno" fluid />
          </CampoFormulario>
          <CampoFormulario id="u-materno" etiqueta="Apellido materno" opcional :error="errores.apellidoMaterno" :contador="{ actual: form.apellidoMaterno.length, max: LIMITES.apellidoMaterno.max }">
            <InputText id="u-materno" v-model="form.apellidoMaterno" :maxlength="LIMITES.apellidoMaterno.max" autocomplete="off" :invalid="!!errores.apellidoMaterno" fluid />
          </CampoFormulario>
        </div>
      </fieldset>

      <fieldset :disabled="cargando || enviando" class="grupo">
        <legend>Cuenta</legend>
        <div class="rejilla">
          <CampoFormulario
            id="u-usuario"
            etiqueta="Usuario"
            :requerido="!editando"
            :error="errores.usuario"
            :ayuda="editando ? 'El nombre de usuario no se puede cambiar.' : 'Letras, números, punto, guion y guion bajo (3 a 50).'"
            :contador="editando ? undefined : { actual: form.usuario.length, max: LIMITES.usuario.max }"
          >
            <InputText id="u-usuario" v-model="form.usuario" :maxlength="LIMITES.usuario.max" :readonly="editando" autocomplete="off" autocapitalize="off" :invalid="!!errores.usuario" fluid />
          </CampoFormulario>
          <CampoFormulario id="u-correo" etiqueta="Correo" requerido :error="errores.correo" :contador="{ actual: form.correo.length, max: LIMITES.correo.max }">
            <InputText id="u-correo" v-model="form.correo" type="email" :maxlength="LIMITES.correo.max" autocomplete="off" :invalid="!!errores.correo" fluid />
          </CampoFormulario>
          <CampoFormulario
            v-if="!editando"
            id="u-password"
            etiqueta="Contraseña"
            requerido
            :error="errores.password"
            :ayuda="`Mínimo ${LIMITES.password.min} caracteres.`"
          >
            <Password
              v-model="form.password"
              input-id="u-password"
              :feedback="false"
              toggle-mask
              :maxlength="LIMITES.password.max"
              autocomplete="new-password"
              :invalid="!!errores.password"
              fluid
            />
            <Button type="button" label="Generar una segura" icon="pi pi-sync" size="small" severity="secondary" text class="generar" @click="generar" />
          </CampoFormulario>
        </div>
      </fieldset>

      <fieldset :disabled="cargando || enviando" class="grupo">
        <legend>Rol y acceso</legend>
        <div class="rejilla">
          <CampoFormulario id="u-rol" etiqueta="Rol" requerido :error="errores.rolSistema">
            <Select
              v-model="form.rolSistema"
              input-id="u-rol"
              :options="roles"
              option-label="rol"
              option-value="rol"
              placeholder="Selecciona un rol"
              :disabled="esMiCuenta"
              :loading="cargandoCatalogos"
              :invalid="!!errores.rolSistema"
              fluid
            />
          </CampoFormulario>
          <CampoFormulario
            v-if="muestraClasificacion"
            id="u-clasificacion"
            etiqueta="Clasificación"
            :requerido="requiereClasificacion"
            :opcional="!requiereClasificacion"
            :error="errores.clasificacionRol"
            :ayuda="requiereClasificacion ? 'Especialidad del rol.' : undefined"
          >
            <Select
              v-model="form.clasificacionRol"
              input-id="u-clasificacion"
              :options="clasificaciones"
              :placeholder="requiereClasificacion ? 'Selecciona' : 'Sin clasificación'"
              :show-clear="!requiereClasificacion"
              :invalid="!!errores.clasificacionRol"
              fluid
            />
          </CampoFormulario>
          <CampoFormulario v-if="editando" id="u-estado" etiqueta="Estado de la cuenta" requerido :error="errores.estadoCuenta">
            <Select
              v-model="form.estadoCuenta"
              input-id="u-estado"
              :options="ESTADOS_CUENTA"
              option-label="etiqueta"
              option-value="valor"
              :disabled="esMiCuenta"
              :invalid="!!errores.estadoCuenta"
              fluid
            />
          </CampoFormulario>
        </div>
      </fieldset>

      <div class="botones">
        <Button type="button" label="Cancelar" severity="secondary" text :disabled="enviando" @click="volver" />
        <Button
          type="submit"
          :label="editando ? 'Guardar cambios' : 'Crear usuario'"
          :icon="editando ? 'pi pi-check' : 'pi pi-user-plus'"
          :loading="enviando"
          :disabled="cargando || cargandoCatalogos || (editando && !hayCambios)"
        />
      </div>
    </form>
  </section>
</template>

<style scoped>
.formulario {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 56rem;
}
.grupo {
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
}
legend {
  font-weight: 700;
  margin-bottom: 12px;
  padding: 0;
}
.rejilla {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}
.generar {
  align-self: flex-start;
}
.botones {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}
.mensaje :deep(.p-message-text) {
  overflow-wrap: anywhere;
}
</style>
