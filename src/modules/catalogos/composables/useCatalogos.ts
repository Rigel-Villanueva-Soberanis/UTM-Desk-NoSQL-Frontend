import { computed, ref } from 'vue'
import { mensajeError } from '@/core/http/errores'
import { normalizarTexto } from '@/core/utils/texto'
import { obtener } from '../api/catalogos.api'
import type { Categoria, Edificio, RolCatalogo } from '../types/catalogo.types'

// Estado a nivel de módulo: todas las vistas comparten los mismos datos (caché en memoria).
const edificios = ref<Edificio[]>([])
const categorias = ref<Categoria[]>([])
const roles = ref<RolCatalogo[]>([])
const cargando = ref(false)
const error = ref('')

let pendiente: Promise<void> | null = null
let cargado = false

/** Pide los 3 catálogos una sola vez; las llamadas siguientes reutilizan la misma petición. */
function cargar(forzar = false): Promise<void> {
  if (forzar) {
    cargado = false
    pendiente = null
  }
  if (cargado) return Promise.resolve()
  if (pendiente) return pendiente

  cargando.value = true
  error.value = ''
  pendiente = Promise.all([
    obtener<Edificio>('edificios'),
    obtener<Categoria>('categorias_incidencia'),
    obtener<RolCatalogo>('roles_sistema'),
  ])
    .then(([e, c, r]) => {
      // Cada edificio trae su lista de salones (si faltara, queda vacía).
      edificios.value = e.contenido.map((x) => ({ ...x, salones: Array.isArray(x.salones) ? x.salones : [] }))
      categorias.value = c.contenido
      roles.value = r.contenido
      cargado = true
    })
    .catch((e) => {
      error.value = mensajeError(e)
      pendiente = null // permite reintentar
    })
    .finally(() => {
      cargando.value = false
    })
  return pendiente
}

/** Vacía la caché (p. ej. al cerrar sesión o después de editar un catálogo). */
export function reiniciarCatalogos() {
  edificios.value = []
  categorias.value = []
  roles.value = []
  error.value = ''
  cargado = false
  pendiente = null
}

export function useCatalogos() {
  void cargar() // la primera vista que lo use dispara la carga

  /** Salones de un edificio (por su clave), para el segundo selector. */
  const salonesDe = (claveEdificio: string) => edificios.value.find((e) => e.clave === claveEdificio)?.salones ?? []

  /** Nombres de edificio sin repetir (para filtros del listado). */
  const nombresEdificio = computed(() => [...new Set(edificios.value.map((e) => e.edificio))])

  const categoriaPorClave = (clave: string) => categorias.value.find((c) => c.clave === clave)
  const edificioPorClave = (clave: string) => edificios.value.find((e) => e.clave === clave)

  /** Rol del catálogo (compara sin acentos ni mayúsculas: "Técnico" = "tecnico"). */
  const rolPorNombre = (rol: string) =>
    roles.value.find((r) => normalizarTexto(r.rol) === normalizarTexto(rol))

  return {
    edificios,
    categorias,
    roles,
    salonesDe,
    nombresEdificio,
    cargando,
    error,
    categoriaPorClave,
    edificioPorClave,
    rolPorNombre,
    /** Espera a que los catálogos estén listos (útil antes de armar un formulario). */
    listo: cargar,
    recargar: () => cargar(true),
  }
}
