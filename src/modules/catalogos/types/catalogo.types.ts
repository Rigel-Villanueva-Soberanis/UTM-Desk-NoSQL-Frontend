/** Catálogos que existen en el backend. */
export type ClaveCatalogo = 'edificios' | 'categorias_incidencia' | 'roles_sistema'

/** GET /api/catalogos/{clave}: el contenido varía según el catálogo. */
export interface Catalogo<T> {
  id: string
  claveCatalogo: ClaveCatalogo
  contenido: T[]
}

/** Catálogo "edificios": un elemento por edificio, con la lista de sus salones. */
export interface Edificio {
  clave: string
  edificio: string
  salones: string[]
}

export type TipoInput = 'text' | 'number' | 'select'

/** Campo del formulario dinámico de una categoría (`detalleEspecifico`). */
export interface CampoDinamico {
  clave: string
  etiqueta: string
  tipo_input: TipoInput
  requerido: boolean
  /** Solo cuando `tipo_input` es "select". */
  opciones?: string[]
}

/** Catálogo "categorias_incidencia". */
export interface Categoria {
  clave: string
  nombre: string
  campos_dinamicos: CampoDinamico[]
}

/** Catálogo "roles_sistema" (los 6 roles son fijos). */
export interface RolCatalogo {
  rol: string
  requiere_clasificacion: boolean
  clasificaciones_permitidas: string[]
}

export interface InfoCatalogo {
  clave: ClaveCatalogo
  titulo: string
  descripcion: string
  icono: string
}

/** Los tres catálogos, en el orden en que se muestran. */
export const CATALOGOS: InfoCatalogo[] = [
  { clave: 'edificios', titulo: 'Edificios y salones', descripcion: 'Edificios y sus salones: se eligen al reportar una falla.', icono: 'pi pi-building' },
  { clave: 'categorias_incidencia', titulo: 'Categorías de incidencia', descripcion: 'Tipos de falla y los campos que se piden en cada una.', icono: 'pi pi-tags' },
  { clave: 'roles_sistema', titulo: 'Roles del sistema', descripcion: 'Roles fijos y las especialidades (clasificaciones) de cada uno.', icono: 'pi pi-id-card' },
]

export const esClaveCatalogo = (c: string): c is ClaveCatalogo => CATALOGOS.some((x) => x.clave === c)

export const TIPOS_INPUT: { valor: TipoInput; etiqueta: string }[] = [
  { valor: 'text', etiqueta: 'Texto' },
  { valor: 'number', etiqueta: 'Número' },
  { valor: 'select', etiqueta: 'Lista de opciones' },
]

/** Los 6 roles son fijos: no se agregan ni se quitan. */
export const ROLES_FIJOS = ['root', 'reportante', 'tecnico', 'soporte', 'directivos', 'administrativos']
