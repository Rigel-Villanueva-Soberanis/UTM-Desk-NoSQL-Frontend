<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import { LIMITES } from '@/core/utils/validacion'
import { acortar } from '@/core/utils/validacion'
import { aviso } from '@/core/http/avisos'
import CampoFormulario from '@/shared/components/CampoFormulario.vue'
import DialogoAccion from '@/shared/components/DialogoAccion.vue'
import { useAccion } from '@/shared/composables/useAccion'
import { restablecerPassword } from '../api/usuarios.api'
import { generarPassword } from '../utils/password'

const props = defineProps<{ usuario: { id: string; nombreCompleto: string; usuario: string } }>()
const emit = defineEmits<{ actualizado: []; cerrado: [] }>()

const accion = useAccion(() => emit('actualizado'))
const { abierto, enviando, errores, mensaje } = accion
const password = ref('')
const verla = ref(false)
watch(password, () => accion.limpiar('nuevaPassword'))

async function copiar() {
  try {
    await navigator.clipboard.writeText(password.value)
    aviso('success', 'Copiada', 'La contraseña se copió al portapapeles.')
  } catch {
    aviso('warn', 'No se pudo copiar', 'Selecciónala y cópiala manualmente.')
  }
}
function generar() {
  password.value = generarPassword()
  verla.value = true
  delete errores.value.nuevaPassword
}
const contexto = computed(() => `${props.usuario.nombreCompleto} · ${props.usuario.usuario}`)

function guardar() {
  void accion.ejecutar({
    campos: ['nuevaPassword'],
    validar: () => {
      if (!password.value) return { nuevaPassword: 'La nueva contraseña es obligatoria.' }
      if (password.value.length < LIMITES.password.min || password.value.length > LIMITES.password.max)
        return { nuevaPassword: `La contraseña debe tener entre ${LIMITES.password.min} y ${LIMITES.password.max} caracteres.` }
      return {}
    },
    enviar: () => restablecerPassword(props.usuario.id, password.value),
    exito: () => ({
      titulo: 'Contraseña restablecida',
      detalle: `Entrega la nueva contraseña a ${acortar(props.usuario.nombreCompleto, 50)}.`,
    }),
  })
}
</script>

<template>
  <DialogoAccion
    v-model:visible="abierto"
    titulo="Restablecer contraseña"
    :contexto="contexto"
    etiqueta-guardar="Restablecer"
    icono-guardar="pi pi-key"
    :enviando="enviando"
    :mensaje="mensaje"
    @guardar="guardar"
    @cerrado="emit('cerrado')"
  >
    <CampoFormulario
      id="rp-password"
      etiqueta="Nueva contraseña"
      requerido
      :error="errores.nuevaPassword"
      :ayuda="`Mínimo ${LIMITES.password.min} caracteres.`"
    >
      <div class="fila">
        <InputText
          id="rp-password"
          v-model="password"
          :type="verla ? 'text' : 'password'"
          :maxlength="LIMITES.password.max"
          autocomplete="new-password"
          :invalid="!!errores.nuevaPassword"
          fluid
        />
        <Button
          type="button"
          :icon="verla ? 'pi pi-eye-slash' : 'pi pi-eye'"
          severity="secondary"
          text
          :aria-label="verla ? 'Ocultar contraseña' : 'Mostrar contraseña'"
          @click="verla = !verla"
        />
      </div>
    </CampoFormulario>
    <div class="herramientas">
      <Button type="button" label="Generar una segura" icon="pi pi-sync" size="small" severity="secondary" @click="generar" />
      <Button type="button" label="Copiar" icon="pi pi-copy" size="small" severity="secondary" text :disabled="!password" @click="copiar" />
    </div>
  </DialogoAccion>
</template>

<style scoped>
.fila {
  display: flex;
  align-items: center;
  gap: 4px;
}
.herramientas {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
