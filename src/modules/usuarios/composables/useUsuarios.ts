import { computed, ref, watch } from 'vue'
import { useRoute, useRouter, type LocationQuery } from 'vue-router'
import { mensajeError } from '@/core/http/errores'
import type { Paginado } from '@/core/types/api'
import { aQuery, entero, texto } from '@/core/utils/query'
import { listar } from '../api/usuarios.api'
import {
  ESTADOS_CUENTA,
  FILTROS_USUARIOS_VACIOS,
  type FiltrosUsuarios,
  type Usuario,
} from '../types/usuario.types'

/** URL → filtros (saneados: una URL escrita a mano no rompe nada). */
function desdeQuery(q: LocationQuery): FiltrosUsuarios {
  const estado = texto(q.estadoCuenta)
  return {
    pagina: entero(q.pagina, 1),
    tamanoPagina: entero(q.tamanoPagina, FILTROS_USUARIOS_VACIOS.tamanoPagina, 1, 50),
    busqueda: texto(q.busqueda),
    nombres: texto(q.nombres),
    apellidos: texto(q.apellidos),
    rol: texto(q.rol),
    clasificacion: texto(q.clasificacion),
    estadoCuenta: ESTADOS_CUENTA.some((e) => e.valor === estado) ? estado : '',
  }
}

/** Listado de usuarios: la URL es la fuente de la verdad (filtros y página). */
export function useUsuarios() {
  const route = useRoute()
  const router = useRouter()

  const filtros = computed(() => desdeQuery(route.query))
  const datos = ref<Paginado<Usuario> | null>(null)
  const cargando = ref(false)
  const error = ref('')
  let ultimaPeticion = 0

  const hayFiltros = computed(() => {
    const f = filtros.value
    return !!(f.busqueda || f.nombres || f.apellidos || f.rol || f.clasificacion || f.estadoCuenta)
  })

  async function cargar() {
    const id = ++ultimaPeticion
    cargando.value = true
    error.value = ''
    try {
      const r = await listar(filtros.value)
      if (id !== ultimaPeticion) return
      datos.value = r
      // Página fuera de rango (p. ej. se eliminó el último de la página): vuelve a la última que existe.
      if (!r.items.length && r.total > 0 && filtros.value.pagina > r.totalPaginas)
        await irAPagina(r.totalPaginas, filtros.value.tamanoPagina, true)
    } catch (e) {
      if (id !== ultimaPeticion) return
      datos.value = null
      error.value = mensajeError(e)
    } finally {
      if (id === ultimaPeticion) cargando.value = false
    }
  }

  watch(
    () => JSON.stringify(route.query),
    () => {
      if (route.name === 'usuarios') void cargar()
    },
    { immediate: true },
  )

  function navegar(nuevos: FiltrosUsuarios, reemplazar = false) {
    const { pagina, tamanoPagina, ...solos } = nuevos // filtros primero, paginación al final
    const destino = { query: aQuery({ ...solos, pagina, tamanoPagina }, FILTROS_USUARIOS_VACIOS) }
    return reemplazar ? router.replace(destino) : router.push(destino)
  }

  const aplicarFiltros = (parcial: Partial<FiltrosUsuarios>) =>
    navegar({ ...filtros.value, ...parcial, pagina: 1 })
  function irAPagina(pagina: number, tamanoPagina = filtros.value.tamanoPagina, reemplazar = false) {
    return navegar({ ...filtros.value, pagina, tamanoPagina }, reemplazar)
  }
  const limpiar = () => navegar({ ...FILTROS_USUARIOS_VACIOS, tamanoPagina: filtros.value.tamanoPagina })

  return { filtros, datos, cargando, error, hayFiltros, aplicarFiltros, irAPagina, limpiar, recargar: cargar }
}
