import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { aviso } from '@/core/http/avisos'
import { aMapa, mensajeError } from '@/core/http/errores'
import { MAX_ARCHIVOS, validarArchivo } from '@/core/utils/archivos'
import { estaVacio, LIMITES, limpiarDetalle, mensajeLongitud, sinControl } from '@/core/utils/validacion'
import { useCatalogos } from '@/modules/catalogos/composables/useCatalogos'
import { ligar, subir } from '../../api/evidencias.api'
import { crear } from '../../api/incidencias.api'
import type {
  DetalleEspecifico,
  EvidenciaSubida,
  Incidencia,
  Prioridad,
} from '../../types/incidencia.types'

/** Mismos límites que el backend. */
const TITULO = LIMITES.titulo
const DESCRIPCION = LIMITES.descripcion

type Etapa = 'creando' | 'subiendo' | 'ligando' | null

const ETAPAS: Record<Exclude<Etapa, null>, string> = {
  creando: 'Registrando la incidencia…',
  subiendo: 'Subiendo evidencias…',
  ligando: 'Adjuntando evidencias…',
}

/**
 * Orquesta el reporte: crear → subir → ligar.
 * Si la incidencia ya se creó y falla lo de las evidencias, NO se vuelve a crear:
 * el reintento continúa desde donde se quedó (así no se duplican folios).
 */
export function useReportar() {
  const router = useRouter()
  const { categoriaPorClave } = useCatalogos()

  const form = reactive({
    titulo: '',
    descripcion: '',
    categoria: '',
    claveEdificio: '',
    salon: '',
    prioridad: 'media' as Prioridad,
    detalleEspecifico: {} as DetalleEspecifico,
  })
  const archivos = ref<File[]>([])
  const errores = ref<Record<string, string>>({})
  const mensaje = ref('')
  const enviando = ref(false)
  const etapa = ref<Etapa>(null)

  // Avance conservado entre reintentos
  const creada = ref<Incidencia | null>(null)
  let subidas: EvidenciaSubida[] | null = null

  const categoria = computed(() => categoriaPorClave(form.categoria))
  const campos = computed(() => categoria.value?.campos_dinamicos ?? [])
  const etapaTexto = computed(() => (etapa.value ? ETAPAS[etapa.value] : ''))
  /** Con la incidencia ya creada, los datos del formulario ya no se pueden editar. */
  const bloqueado = computed(() => !!creada.value)

  /** Errores de evidencias (cliente o backend: `evidencias[0].publicId`, `archivos`…). */
  const errorEvidencias = computed(() => {
    const e = errores.value
    const clave = Object.keys(e).find((k) => k === 'evidencias' || k === 'archivos' || k.startsWith('evidencias['))
    return clave ? (e[clave] ?? '') : ''
  })

  // Al cambiar de categoría los campos dinámicos son otros.
  watch(
    () => form.categoria,
    () => {
      form.detalleEspecifico = {}
      quitarErroresDinamicos()
    },
  )

  // Al corregir un campo se limpia su error.
  for (const campo of ['titulo', 'descripcion', 'categoria', 'claveEdificio', 'salon', 'prioridad'] as const) {
    watch(
      () => form[campo],
      () => delete errores.value[campo],
    )
  }
  watch(
    () => form.detalleEspecifico,
    (d) => {
      for (const k of Object.keys(errores.value)) {
        const clave = k.replace('detalleEspecifico.', '')
        if (k.startsWith('detalleEspecifico.') && d[clave] !== undefined) delete errores.value[k]
      }
    },
  )
  watch(archivos, () => {
    delete errores.value.evidencias
    delete errores.value.archivos
    subidas = null // si cambian los archivos, lo ya subido ya no corresponde
  })

  function quitarErroresDinamicos() {
    for (const k of Object.keys(errores.value))
      if (k.startsWith('detalleEspecifico.')) delete errores.value[k]
  }

  /** Validación en cliente, igual a la del backend. */
  function validar(): boolean {
    const e: Record<string, string> = {}
    const titulo = sinControl(form.titulo).trim()
    const descripcion = sinControl(form.descripcion).trim()

    if (titulo.length < TITULO.min || titulo.length > TITULO.max)
      e.titulo = mensajeLongitud('El título', TITULO.min, TITULO.max)
    if (descripcion.length < DESCRIPCION.min || descripcion.length > DESCRIPCION.max)
      e.descripcion = mensajeLongitud('La descripción', DESCRIPCION.min, DESCRIPCION.max)
    if (!form.categoria) e.categoria = 'Selecciona una categoría.'
    if (!form.claveEdificio) e.claveEdificio = 'Selecciona un edificio.'
    if (!form.salon) e.salon = 'Selecciona un salón.'

    for (const c of campos.value) {
      const v = form.detalleEspecifico[c.clave]
      if (c.requerido && estaVacio(v))
        e[`detalleEspecifico.${c.clave}`] = 'Es obligatorio.'
    }

    if (archivos.value.length > MAX_ARCHIVOS) e.evidencias = `Máximo ${MAX_ARCHIVOS} archivos por reporte.`
    else {
      const motivos = archivos.value.map((a) => validarArchivo(a)).filter(Boolean)
      if (motivos.length) e.evidencias = motivos.join(' ')
    }

    errores.value = e
    return Object.keys(e).length === 0
  }

  function reiniciar() {
    form.titulo = ''
    form.descripcion = ''
    form.categoria = ''
    form.claveEdificio = ''
    form.salon = ''
    form.prioridad = 'media'
    form.detalleEspecifico = {}
    archivos.value = []
    errores.value = {}
    mensaje.value = ''
    creada.value = null
    subidas = null
  }

  /** Avisa con el folio y lleva al expediente (si esa pantalla ya existe) o deja el formulario limpio. */
  async function terminar() {
    const inc = creada.value
    if (!inc) return
    aviso('success', 'Incidencia registrada', `Tu folio es ${inc.folio}`)
    reiniciar()
    if (router.hasRoute('expediente')) await router.push({ name: 'expediente', params: { id: inc.id } })
  }

  /** Devuelve true si todo salió bien. */
  async function enviar(): Promise<boolean> {
    if (enviando.value) return false
    mensaje.value = ''
    if (!creada.value && !validar()) return false
    if (creada.value && archivos.value.length && !validar()) return false

    enviando.value = true
    try {
      if (!creada.value) {
        etapa.value = 'creando'
        creada.value = await crear({
          titulo: sinControl(form.titulo).trim(),
          descripcion: sinControl(form.descripcion).trim(),
          categoria: form.categoria,
          claveEdificio: form.claveEdificio,
          salon: form.salon,
          prioridad: form.prioridad,
          detalleEspecifico: limpiarDetalle(form.detalleEspecifico),
        })
      }

      if (archivos.value.length) {
        if (!subidas) {
          etapa.value = 'subiendo'
          subidas = await subir(archivos.value)
        }
        etapa.value = 'ligando'
        await ligar(
          creada.value.id,
          subidas.map(({ publicId, formato, nombreArchivo }) => ({ publicId, formato, nombreArchivo })),
        )
      }

      enviando.value = false
      etapa.value = null
      await terminar()
      return true
    } catch (e) {
      errores.value = aMapa(e)
      if (creada.value) {
        aviso('warn', `La incidencia ${creada.value.folio} ya quedó registrada`, `No se pudieron adjuntar las evidencias: ${mensajeError(e)}`)
      } else {
        aviso('error', 'No se pudo reportar la falla', mensajeError(e))
      }
      return false
    } finally {
      enviando.value = false
      etapa.value = null
    }
  }

  return {
    form,
    archivos,
    errores,
    mensaje,
    enviando,
    etapaTexto,
    campos,
    bloqueado,
    creada,
    errorEvidencias,
    enviar,
    /** Continuar sin las evidencias que fallaron. */
    omitirEvidencias: terminar,
  }
}
