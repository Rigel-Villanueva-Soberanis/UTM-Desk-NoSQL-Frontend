import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { normalizarRol, type Rol } from './permisos'

/** Lo que responde POST /api/Auth/login dentro de `data`. */
export interface RespuestaLogin {
  token: string
  tokenType: string
  expiresIn: number
  expiresAt: string
  id: string
  nombres: string
  apellidoPaterno: string
  apellidoMaterno: string | null
  nombreCompleto: string
  usuario: string
  correo: string
  rolSistema: string
  clasificacionRol: string | null
}

export interface UsuarioSesion {
  id: string
  nombreCompleto: string
  /** Desglose del nombre (para "Mi cuenta"). Las sesiones guardadas antes del Paso 12 no lo traen. */
  nombres?: string
  apellidoPaterno?: string
  apellidoMaterno?: string | null
  usuario: string
  correo: string
  rol: Rol
  clasificacion: string | null
}

const CLAVE = 'utmdesk.sesion'

interface Guardado {
  token: string
  expiraEn: string
  usuario: UsuarioSesion
}

export const useSesionStore = defineStore('sesion', () => {
  const token = ref<string | null>(null)
  const expiraEn = ref<string | null>(null)
  const usuario = ref<UsuarioSesion | null>(null)

  const rol = computed<Rol | null>(() => usuario.value?.rol ?? null)
  const autenticado = computed(
    () => !!token.value && !!expiraEn.value && Date.now() < Date.parse(expiraEn.value),
  )

  function guardar() {
    try {
      if (token.value && expiraEn.value && usuario.value) {
        const dato: Guardado = { token: token.value, expiraEn: expiraEn.value, usuario: usuario.value }
        localStorage.setItem(CLAVE, JSON.stringify(dato))
      } else {
        localStorage.removeItem(CLAVE)
      }
    } catch {
      /* almacenamiento no disponible: la sesión vive solo en memoria */
    }
  }

  function login(r: RespuestaLogin) {
    token.value = r.token
    expiraEn.value = r.expiresAt
    usuario.value = {
      id: r.id,
      nombreCompleto: r.nombreCompleto,
      nombres: r.nombres,
      apellidoPaterno: r.apellidoPaterno,
      apellidoMaterno: r.apellidoMaterno,
      usuario: r.usuario,
      correo: r.correo,
      rol: normalizarRol(r.rolSistema),
      clasificacion: r.clasificacionRol,
    }
    guardar()
  }

  /** Después de editar el perfil: el encabezado y "Mi cuenta" muestran los datos nuevos sin volver a iniciar sesión. */
  function actualizarPerfil(d: Pick<UsuarioSesion, 'nombreCompleto' | 'nombres' | 'apellidoPaterno' | 'apellidoMaterno' | 'correo'>) {
    if (!usuario.value) return
    usuario.value = { ...usuario.value, ...d }
    guardar()
  }

  function logout() {
    token.value = null
    expiraEn.value = null
    usuario.value = null
    guardar()
  }

  function cargarDeStorage() {
    try {
      const crudo = localStorage.getItem(CLAVE)
      if (!crudo) return
      const d = JSON.parse(crudo) as Guardado
      token.value = d.token
      expiraEn.value = d.expiraEn
      usuario.value = d.usuario
      if (!autenticado.value) logout() // venció mientras estaba cerrada la pestaña
    } catch {
      logout()
    }
  }

  cargarDeStorage()

  return { token, expiraEn, usuario, rol, autenticado, login, actualizarPerfil, logout, cargarDeStorage }
})
