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
import DialogoAccion from '@/shared/components/DialogoAccion.vue'
import { useFormUsuario } from '../composables/useFormUsuario'
import { ESTADOS_CUENTA } from '../types/usuario.types'
import { generarPassword } from '../utils/password'

/** Crear (sin `id`) o editar (con `id`) un usuario en un modal. */
const props = defineProps<{ id?: string }>()
const emit = defineEmits<{ guardado: []; cerrado: [] }>()

const abierto = ref(true)
const idRef = computed(() => props.id)
const {
  editando, form, errores, mensaje, enviando, cargando, cargandoCatalogos, errorCatalogos, errorCarga, mensajeCarga,
  roles, clasificaciones, requiereClasificacion, muestraClasificacion, esMiCuenta, hayCambios,
  guardar, reintentar, recargarCatalogos,
} = useFormUsuario(idRef, () => {
  emit('guardado')
  abierto.value = false
})

const falla = computed(() => (errorCarga.value ? mensajeCarga.value || 'No se pudo cargar el usuario.' : errorCatalogos.value))
const ocupado = computed(() => cargando.value || cargandoCatalogos.value)

function generar() {
  form.password = generarPassword()
}

async function enviar() {
  await guardar()
  requestAnimationFrame(() => document.querySelector<HTMLElement>('.p-dialog .invalido input, .p-dialog .invalido .p-select')?.focus())
}
</script>

<template>
  <DialogoAccion
    v-model:visible="abierto"
    :titulo="editando ? 'Editar usuario' : 'Nuevo usuario'"
    :etiqueta-guardar="editando ? 'Guardar cambios' : 'Crear usuario'"
    :icono-guardar="editando ? 'pi pi-check' : 'pi pi-user-plus'"
    :enviando="enviando"
    :sin-cambios="!!falla || ocupado || (editando && !hayCambios)"
    :mensaje="mensaje"
    ancho="46rem"
    @guardar="enviar"
    @cerrado="emit('cerrado')"
  >
    <div v-if="falla" class="falla">
      <Message severity="error" :closable="false">{{ falla }}</Message>
      <Button
        label="Reintentar"
        icon="pi pi-refresh"
        severity="secondary"
        size="small"
        @click="errorCarga ? reintentar() : recargarCatalogos()"
      />
    </div>

    <div v-else-if="ocupado" class="esqueleto" aria-busy="true">
      <Skeleton v-for="n in 4" :key="n" height="3rem" />
    </div>

    <template v-else>
      <Message v-if="esMiCuenta" severity="info" :closable="false">
        Es tu propia cuenta: no puedes cambiar tu rol ni su estado para no quedarte sin acceso.
      </Message>

      <fieldset :disabled="enviando" class="grupo">
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

      <fieldset :disabled="enviando" class="grupo">
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

      <fieldset :disabled="enviando" class="grupo">
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
    </template>
  </DialogoAccion>
</template>

<style scoped>
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
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}
.generar {
  align-self: flex-start;
}
.falla {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}
.esqueleto {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
