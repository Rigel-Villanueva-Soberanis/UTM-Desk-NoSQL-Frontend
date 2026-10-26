import axios from 'axios'
import { computed, reactive, ref, watch, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSesionStore } from '@/core/auth/sesion.store'
import { aviso } from '@/core/http/avisos'
import { aMapa, estadoHttp, mensajeError } from '@/core/http/errores'
import { normalizarTexto } from '@/core/utils/texto'
import {
  LIMITES,
  REGEX_CORREO,
  REGEX_USUARIO,
  limpiarEspacios,
  mensajeLongitud,
  sinControl,
} from '@/core/utils/validacion'
import { useCatalogos } from '@/modules/catalogos/composables/useCatalogos'
import { actualizar, crear, obtener } from '../api/usuarios.api'
import { ESTADOS_CUENTA, type Usuario } from '../types/usuario.types'

const vacio = () => ({
  nombres: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  usuario: '',
  correo: '',
  password: '',
  rolSistema: '',
  clasificacionRol: '',
  estadoCuenta: 'activo',
})

const limpio = (t: string) => limpiarEspacios(sinControl(t))

/**
 * Formulario de usuario (Paso 11.1): crear (`id` vacío) o editar.
 * Las reglas son las del backend (#28/#29); el backend siempre tiene la última palabra.
 */
export function useFormUsuario(id: Ref<string | undefined>) {
  const router = useRouter()
  const sesion = useSesionStore()
  const { roles, listo, cargando: cargandoCatalogos, error: errorCatalogos, recargar: recargarCatalogos } = useCatalogos()

  const editando = computed(() => !!id.value)
  const form = reactive(vacio())
  const errores = ref<Record<string, string>>({})
  const mensaje = ref('')
  const enviando = ref(false)

  const cargando = ref(false)
  const errorCarga = ref<'no-encontrado' | 'otro' | null>(null)
  const mensajeCarga = ref('')
  const original = ref<Usuario | null>(null)
  let ultimaCarga = 0

  const rolElegido = computed(() => roles.value.find((r) => r.rol === form.rolSistema))
  const clasificaciones = computed(() => rolElegido.value?.clasificaciones_permitidas ?? [])
  const requiereClasificacion = computed(() => !!rolElegido.value?.requiere_clasificacion)
  /** El Select de clasificación depende del rol elegido. */
  const muestraClasificacion = computed(() => clasificaciones.value.length > 0 || requiereClasificacion.value)
  /** Para no dejarse sin acceso a uno mismo: en su propia cuenta no se cambian rol ni estado. */
  const esMiCuenta = computed(() => editando.value && id.value === sesion.usuario?.id)

  /** Compara sin acentos ni mayúsculas ("técnico" del backend = "Técnico" del catálogo). */
  const igual = (a: string, b: string) => normalizarTexto(a) === normalizarTexto(b)

  function llenar(u: Usuario) {
    original.value = u
    form.nombres = u.nombres ?? ''
    form.apellidoPaterno = u.apellidoPaterno ?? ''
    form.apellidoMaterno = u.apellidoMaterno ?? ''
    form.usuario = u.usuario ?? ''
    form.correo = u.correo ?? ''
    const rol = roles.value.find((r) => igual(r.rol, u.rolSistema ?? ''))
    form.rolSistema = rol?.rol ?? u.rolSistema ?? ''
    form.clasificacionRol =
      rol?.clasificaciones_permitidas.find((c) => igual(c, u.clasificacionRol ?? '')) ?? u.clasificacionRol ?? ''
    form.estadoCuenta = ESTADOS_CUENTA.find((e) => igual(e.valor, u.estadoCuenta ?? ''))?.valor ?? 'activo'
  }

  async function cargar() {
    const n = ++ultimaCarga
    errorCarga.value = null
    mensajeCarga.value = ''
    await listo() // primero los catálogos: el rol y la clasificación se muestran con su nombre del catálogo
    if (n !== ultimaCarga) return
    if (!editando.value) {
      Object.assign(form, vacio())
      original.value = null
      return
    }
    cargando.value = true
    try {
      const u = await obtener(id.value!)
      if (n === ultimaCarga) llenar(u)
    } catch (e) {
      if (n !== ultimaCarga) return
      const s = estadoHttp(e)
      errorCarga.value = s === 404 || s === 400 ? 'no-encontrado' : 'otro'
      mensajeCarga.value = mensajeError(e)
    } finally {
      if (n === ultimaCarga) cargando.value = false
    }
  }
  watch(id, () => void cargar(), { immediate: true })

  // Al cambiar de rol, la clasificación anterior puede ya no aplicar.
  watch(
    () => form.rolSistema,
    () => {
      if (form.clasificacionRol && !clasificaciones.value.includes(form.clasificacionRol)) form.clasificacionRol = ''
      if (!form.clasificacionRol && requiereClasificacion.value && clasificaciones.value.length === 1)
        form.clasificacionRol = clasificaciones.value[0]!
    },
  )

  // Al corregir un campo se limpia su error.
  for (const k of Object.keys(vacio()) as (keyof ReturnType<typeof vacio>)[])
    watch(() => form[k], () => delete errores.value[k])

  /** Validación en cliente, igual a la del backend. Regresa los errores por campo. */
  function validar(): Record<string, string> {
    const e: Record<string, string> = {}
    const nombres = limpio(form.nombres)
    const paterno = limpio(form.apellidoPaterno)
    const materno = limpio(form.apellidoMaterno)

    if (!nombres) e.nombres = 'Los nombres son obligatorios.'
    else if (nombres.length < LIMITES.nombres.min || nombres.length > LIMITES.nombres.max)
      e.nombres = mensajeLongitud('Los nombres', LIMITES.nombres.min, LIMITES.nombres.max)

    if (!paterno) e.apellidoPaterno = 'El apellido paterno es obligatorio.'
    else if (paterno.length < LIMITES.apellidoPaterno.min || paterno.length > LIMITES.apellidoPaterno.max)
      e.apellidoPaterno = mensajeLongitud('El apellido paterno', LIMITES.apellidoPaterno.min, LIMITES.apellidoPaterno.max)

    if (materno.length > LIMITES.apellidoMaterno.max)
      e.apellidoMaterno = mensajeLongitud('El apellido materno', 0, LIMITES.apellidoMaterno.max)

    if (!editando.value) {
      const usuario = form.usuario.trim()
      if (!usuario) e.usuario = 'El usuario es obligatorio.'
      else if (!REGEX_USUARIO.test(usuario))
        e.usuario = `El usuario debe tener entre ${LIMITES.usuario.min} y ${LIMITES.usuario.max} caracteres: solo letras, números, punto, guion y guion bajo.`

      if (!form.password) e.password = 'La contraseña es obligatoria.'
      else if (form.password.length < LIMITES.password.min || form.password.length > LIMITES.password.max)
        e.password = `La contraseña debe tener entre ${LIMITES.password.min} y ${LIMITES.password.max} caracteres.`
    }

    const correo = form.correo.trim()
    if (!correo) e.correo = 'El correo es obligatorio.'
    else if (correo.length > LIMITES.correo.max || !REGEX_CORREO.test(correo)) e.correo = 'Escribe un correo válido (ej. nombre@utm.mx).'

    if (!form.rolSistema) e.rolSistema = 'Selecciona un rol.'
    else if (!rolElegido.value) e.rolSistema = 'Ese rol no existe en el catálogo.'
    else if (requiereClasificacion.value && !form.clasificacionRol)
      e.clasificacionRol = 'Este rol requiere una clasificación.'
    else if (form.clasificacionRol && !clasificaciones.value.includes(form.clasificacionRol))
      e.clasificacionRol = 'Esa clasificación no es válida para el rol elegido.'

    if (editando.value && !ESTADOS_CUENTA.some((s) => s.valor === form.estadoCuenta))
      e.estadoCuenta = 'Selecciona el estado de la cuenta.'
    return e
  }

  /** Vuelve al listado con sus filtros (si venía de él); si no, al listado limpio. */
  function volver() {
    if (window.history.state?.back) router.back()
    else void router.push('/usuarios')
  }

  const hayCambios = computed(() => {
    const o = original.value
    if (!editando.value || !o) return true
    return (
      limpio(form.nombres) !== (o.nombres ?? '') ||
      limpio(form.apellidoPaterno) !== (o.apellidoPaterno ?? '') ||
      limpio(form.apellidoMaterno) !== (o.apellidoMaterno ?? '') ||
      form.correo.trim() !== (o.correo ?? '') ||
      !igual(form.rolSistema, o.rolSistema ?? '') ||
      !igual(form.clasificacionRol, o.clasificacionRol ?? '') ||
      !igual(form.estadoCuenta, o.estadoCuenta ?? '')
    )
  })

  const CAMPOS = ['nombres', 'apellidoPaterno', 'apellidoMaterno', 'usuario', 'correo', 'password', 'rolSistema', 'clasificacionRol', 'estadoCuenta']

  /** Devuelve true si se guardó. */
  async function guardar(): Promise<boolean> {
    if (enviando.value) return false
    mensaje.value = ''
    errores.value = validar()
    if (Object.keys(errores.value).length) return false

    const comun = {
      nombres: limpio(form.nombres),
      apellidoPaterno: limpio(form.apellidoPaterno),
      ...(limpio(form.apellidoMaterno) ? { apellidoMaterno: limpio(form.apellidoMaterno) } : {}),
      correo: form.correo.trim(),
      rolSistema: form.rolSistema,
      ...(muestraClasificacion.value && form.clasificacionRol ? { clasificacionRol: form.clasificacionRol } : {}),
    }

    enviando.value = true
    try {
      if (editando.value) {
        await actualizar(id.value!, { ...comun, estadoCuenta: form.estadoCuenta })
        aviso('success', 'Usuario actualizado', `Los cambios de ${comun.nombres} quedaron guardados.`)
      } else {
        await crear({ ...comun, usuario: form.usuario.trim(), password: form.password })
        aviso('success', 'Usuario creado', `${comun.nombres} ya puede iniciar sesión como ${form.usuario.trim()}.`)
      }
      volver()
      return true
    } catch (e) {
      const mapa = aMapa(e)
      const texto = mensajeError(e)
      // 409 "ya existe": se marca en el campo que corresponde (usuario o correo).
      if (estadoHttp(e) === 409 || (axios.isAxiosError(e) && e.response?.status === 400 && !Object.keys(mapa).length)) {
        const t = normalizarTexto(texto)
        if (t.includes('correo')) mapa.correo = texto
        else if (t.includes('usuario') && !editando.value) mapa.usuario = texto
      }
      errores.value = mapa
      const conocidos = new Set(CAMPOS)
      const ajenos = new Set(
        Object.entries(mapa)
          .filter(([k]) => !conocidos.has(k.charAt(0).toLowerCase() + k.slice(1)))
          .map(([, m]) => m),
      )
      aviso('error', editando.value ? 'No se pudo guardar el usuario' : 'No se pudo crear el usuario', [texto, ...ajenos].join(' '))
      return false
    } finally {
      enviando.value = false
    }
  }

  return {
    editando,
    form,
    errores,
    mensaje,
    enviando,
    cargando,
    cargandoCatalogos,
    errorCatalogos,
    errorCarga,
    mensajeCarga,
    roles,
    clasificaciones,
    requiereClasificacion,
    muestraClasificacion,
    esMiCuenta,
    hayCambios,
    guardar,
    volver,
    reintentar: cargar,
    recargarCatalogos,
  }
}
