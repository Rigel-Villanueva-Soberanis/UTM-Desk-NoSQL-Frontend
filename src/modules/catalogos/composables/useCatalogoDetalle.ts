import { computed, ref, watch, type Ref } from 'vue'
import { estadoHttp, mensajeError } from '@/core/http/errores'
import { obtener } from '../api/catalogos.api'
import { esClaveCatalogo, type ClaveCatalogo } from '../types/catalogo.types'
import { useCatalogos } from './useCatalogos'

/** Detalle de un catálogo (`GET /api/catalogos/{clave}`) y refresco de la caché compartida tras editarlo. */
export function useCatalogoDetalle<T>(clave: Ref<string>) {
  const { recargar: recargarCache } = useCatalogos()
  const valida = computed(() => esClaveCatalogo(clave.value))
  const contenido = ref<T[]>([]) as Ref<T[]>
  const cargando = ref(false)
  const error = ref('')
  const noEncontrado = ref(false)
  let ultima = 0

  async function cargar() {
    if (!valida.value) return
    const n = ++ultima
    cargando.value = true
    error.value = ''
    noEncontrado.value = false
    try {
      const r = await obtener<T>(clave.value as ClaveCatalogo)
      if (n === ultima) contenido.value = r.contenido ?? []
    } catch (e) {
      if (n !== ultima) return
      contenido.value = []
      if (estadoHttp(e) === 404) noEncontrado.value = true
      else error.value = mensajeError(e)
    } finally {
      if (n === ultima) cargando.value = false
    }
  }
  watch(clave, () => void cargar(), { immediate: true })

  /** Tras guardar: vuelve a pedir el catálogo y actualiza lo que usan los demás formularios (Reportar, filtros…). */
  async function despuesDeEditar() {
    await Promise.all([cargar(), recargarCache()])
  }

  return { valida, contenido, cargando, error, noEncontrado, recargar: cargar, despuesDeEditar }
}
