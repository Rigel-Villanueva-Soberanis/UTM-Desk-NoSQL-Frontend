import { computed, reactive, ref, watch } from 'vue'
import { ETIQUETA_ROL, type Rol } from '@/core/auth/permisos'
import { useSesionStore } from '@/core/auth/sesion.store'
import { aviso } from '@/core/http/avisos'
import { aMapa, estadoHttp, mensajeError } from '@/core/http/errores'
import {
  LIMITES,
  REGEX_CORREO,
  limpiarEspacios,
  mensajeLongitud,
  sinControl,
} from '@/core/utils/validacion'
import { formatearFecha } from '@/core/utils/fechas'
import { actualizarPerfil, obtenerPerfil, type PerfilServidor } from '../api/mi-cuenta.api'

const limpio = (t: string) => limpiarEspacios(sinControl(t))

/** Pestaña "Perfil": nombre y correo propios. Al guardar se actualiza la sesión (encabezado). */
export function useMiPerfil() {
  const sesion = useSesionStore()
  const form = reactive({ nombres: '', apellidoPaterno: '', apellidoMaterno: '', correo: '' })
  const errores = ref<Record<string, string>>({})
  const mensaje = ref('')
  const enviando = ref(false)
  const cargando = ref(true)
  /** Datos que Soporte de TI controla: solo se muestran (bloqueados). */
  const cuenta = reactive({ usuario: '', rol: '', clasificacion: '', estado: '', creada: '' })
  const mayus = (t: string) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : '')
  function aplicarCuenta(p?: PerfilServidor | null) {
    const u = sesion.usuario
    cuenta.usuario = p?.usuario || u?.usuario || ''
    const rol = p?.rolSistema || u?.rol || ''
    cuenta.rol = (ETIQUETA_ROL as Record<string, string>)[rol as Rol] ?? rol
    cuenta.clasificacion = p?.clasificacionRol ?? u?.clasificacion ?? ''
    cuenta.estado = mayus(p?.estadoCuenta ?? '')
    cuenta.creada = p?.fechaCreacion ? formatearFecha(p.fechaCreacion) : ''
  }
  aplicarCuenta()

  function desdeSesion() {
    const u = sesion.usuario
    form.nombres = u?.nombres ?? ''
    form.apellidoPaterno = u?.apellidoPaterno ?? ''
    form.apellidoMaterno = u?.apellidoMaterno ?? ''
    form.correo = u?.correo ?? ''
  }
  desdeSesion()

  /** Al entrar se consulta GET /api/Usuario/mi-perfil para mostrar los datos reales (no solo lo guardado al iniciar sesión). */
  async function cargar() {
    cargando.value = true
    try {
      const p = await obtenerPerfil()
      const u = sesion.usuario
      if (p && u) {
        const nombres = typeof p.nombres === 'string' ? p.nombres : u.nombres
        const apellidoPaterno = typeof p.apellidoPaterno === 'string' ? p.apellidoPaterno : u.apellidoPaterno
        const apellidoMaterno = typeof p.apellidoMaterno === 'string' || p.apellidoMaterno === null ? p.apellidoMaterno : u.apellidoMaterno
        sesion.actualizarPerfil({
          nombreCompleto:
            (typeof p.nombreCompleto === 'string' && p.nombreCompleto) ||
            [nombres, apellidoPaterno, apellidoMaterno].filter(Boolean).join(' ') ||
            u.nombreCompleto,
          nombres,
          apellidoPaterno,
          apellidoMaterno,
          correo: typeof p.correo === 'string' ? p.correo : u.correo,
        })
      }
      desdeSesion()
      aplicarCuenta(p)
    } catch {
      // Sin respuesta: se queda con lo que ya había en la sesión (el aviso azul explica si falta el desglose).
    } finally {
      cargando.value = false
    }
  }
  void cargar()

  /** Sesión guardada antes de existir "Mi cuenta": no trae el nombre desglosado. */
  const faltaDesglose = computed(() => !cargando.value && !sesion.usuario?.nombres)

  for (const k of Object.keys(form) as (keyof typeof form)[]) watch(() => form[k], () => delete errores.value[k])

  const hayCambios = computed(() => {
    const u = sesion.usuario
    return (
      limpio(form.nombres) !== (u?.nombres ?? '') ||
      limpio(form.apellidoPaterno) !== (u?.apellidoPaterno ?? '') ||
      limpio(form.apellidoMaterno) !== (u?.apellidoMaterno ?? '') ||
      form.correo.trim() !== (u?.correo ?? '')
    )
  })

  function validar(): Record<string, string> {
    const e: Record<string, string> = {}
    const n = limpio(form.nombres)
    const p = limpio(form.apellidoPaterno)
    const m = limpio(form.apellidoMaterno)
    const c = form.correo.trim()
    if (!n) e.nombres = 'Los nombres son obligatorios.'
    else if (n.length < LIMITES.nombres.min || n.length > LIMITES.nombres.max) e.nombres = mensajeLongitud('Los nombres', LIMITES.nombres.min, LIMITES.nombres.max)
    if (!p) e.apellidoPaterno = 'El apellido paterno es obligatorio.'
    else if (p.length < LIMITES.apellidoPaterno.min || p.length > LIMITES.apellidoPaterno.max)
      e.apellidoPaterno = mensajeLongitud('El apellido paterno', LIMITES.apellidoPaterno.min, LIMITES.apellidoPaterno.max)
    if (m.length > LIMITES.apellidoMaterno.max) e.apellidoMaterno = mensajeLongitud('El apellido materno', 0, LIMITES.apellidoMaterno.max)
    if (!c) e.correo = 'El correo es obligatorio.'
    else if (c.length > LIMITES.correo.max || !REGEX_CORREO.test(c)) e.correo = 'Escribe un correo válido (ej. nombre@utm.mx).'
    return e
  }

  async function guardar(): Promise<boolean> {
    if (enviando.value || cargando.value) return false
    mensaje.value = ''
    errores.value = validar()
    if (Object.keys(errores.value).length) return false

    const datos = {
      nombres: limpio(form.nombres),
      apellidoPaterno: limpio(form.apellidoPaterno),
      ...(limpio(form.apellidoMaterno) ? { apellidoMaterno: limpio(form.apellidoMaterno) } : {}),
      correo: form.correo.trim(),
    }
    enviando.value = true
    try {
      const r = await actualizarPerfil(datos)
      const nombreCompleto =
        (r && typeof r.nombreCompleto === 'string' && r.nombreCompleto) ||
        [datos.nombres, datos.apellidoPaterno, datos.apellidoMaterno].filter(Boolean).join(' ')
      sesion.actualizarPerfil({
        nombreCompleto,
        nombres: datos.nombres,
        apellidoPaterno: datos.apellidoPaterno,
        apellidoMaterno: datos.apellidoMaterno ?? null,
        correo: datos.correo,
      })
      desdeSesion()
      aviso('success', 'Perfil actualizado', 'Tus datos quedaron guardados.')
      return true
    } catch (e) {
      const mapa = aMapa(e)
      const texto = mensajeError(e)
      if (estadoHttp(e) === 409 && /correo/i.test(texto)) mapa.correo = texto
      errores.value = mapa
      const conocidos = ['nombres', 'apellidoPaterno', 'apellidoMaterno', 'correo']
      const ajenos = new Set(Object.entries(mapa).filter(([k]) => !conocidos.includes(k.charAt(0).toLowerCase() + k.slice(1))).map(([, v]) => v))
      aviso('error', 'No se pudo guardar el perfil', [texto, ...ajenos].join(' '))
      return false
    } finally {
      enviando.value = false
    }
  }

  return { form, cuenta, errores, mensaje, enviando, cargando, hayCambios, faltaDesglose, guardar }
}
