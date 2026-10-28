/**
 * Límites de los formularios. Son los mismos que valida el backend
 * (Guía de Consumo de Endpoints); el backend siempre tiene la última palabra.
 */
export const LIMITES = {
  titulo: { min: 5, max: 150 },
  descripcion: { min: 10, max: 2000 },
  motivo: { min: 5, max: 500 },
  nota: { min: 3, max: 2000 },
  /** Cada registro de tiempo: de 1 minuto a 24 horas (horas 0–24, minutos 0–59, enteros). */
  tiempo: { maxHoras: 24, maxMinutos: 59 },
  comentarioHoras: { max: 300 },
  etiqueta: { min: 2, max: 30 },
  etiquetasPorLista: 10,
  etiquetasPorIncidencia: 15,
  /** El backend no publica tope para estos campos: se usa uno razonable para que no se desborde la UI. */
  empresa: { max: 150 },
  tecnicoResponsable: { max: 150 },
  contacto: { max: 100 },
  ordenServicio: { max: 50 },
  /** Campos dinámicos de tipo texto. */
  campoDinamico: { max: 200 },
  /** Texto libre de un filtro (URL). */
  filtro: { max: 100 },
  /** Usuarios (Guía de Consumo, #28). */
  nombres: { min: 2, max: 80 },
  apellidoPaterno: { min: 2, max: 60 },
  apellidoMaterno: { max: 60 },
  usuario: { min: 3, max: 50 },
  password: { min: 8, max: 128 },
  correo: { max: 254 },
  /** Catálogos: sin tope publicado, uno razonable para la UI. */
  claveCatalogo: { max: 50 },
  textoCatalogo: { max: 120 },
  opcionCampo: { max: 100 },
  /** Confirmación de borrado. */
  folio: { max: 40 },
} as const

/** Etiqueta (tag): sin acentos ni mayúsculas, 2–30 caracteres, letras/números/espacio/-/_. */
export const REGEX_ETIQUETA = /^[a-z0-9 _-]{2,30}$/

/** Quita espacios de los extremos y colapsa los espacios repetidos ("a   b" → "a b"). */
export const limpiarEspacios = (t: string) => t.trim().replace(/\s+/g, ' ')

/** Quita caracteres de control (salvo salto de línea y tabulación) que a veces se cuelan al pegar. */
export const sinControl = (t: string) =>
  Array.from(t)
    .filter((c) => {
      const n = c.charCodeAt(0)
      return !(n <= 8 || n === 11 || n === 12 || (n >= 14 && n <= 31) || n === 127)
    })
    .join('')

/** Mensaje de rango de longitud: "…debe tener entre 5 y 150 caracteres." */
export function mensajeLongitud(nombre: string, min: number, max: number) {
  return min > 0
    ? `${nombre} debe tener entre ${min} y ${max} caracteres.`
    : `${nombre} no puede tener más de ${max} caracteres.`
}

/**
 * Valida un texto ya recortado. Regresa el mensaje de error o '' si es válido.
 * `requerido` false: se permite vacío (solo se valida el máximo).
 */
export function validarLongitud(
  nombre: string,
  valor: string,
  { min = 0, max, requerido = true }: { min?: number; max: number; requerido?: boolean },
): string {
  const v = valor.trim()
  if (!v) return requerido ? `${nombre} es obligatorio.` : ''
  if (v.length < min || v.length > max) return mensajeLongitud(nombre, min, max)
  return ''
}

/** Acorta un texto largo con "…" (para toasts, títulos de diálogo, etc.). */
export function acortar(t: string | null | undefined, max: number): string {
  const s = (t ?? '').trim()
  return s.length > max ? `${s.slice(0, Math.max(0, max - 1)).trimEnd()}…` : s
}


/** ¿Falta el valor de un campo dinámico? (vacío o solo espacios). */
export const estaVacio = (v: string | number | undefined | null) =>
  v === undefined || v === null || (typeof v === 'string' && v.trim() === '')

/** `detalleEspecifico` listo para enviar: textos recortados y sin campos vacíos. */
export function limpiarDetalle(d: Record<string, string | number>): Record<string, string | number> {
  const limpio: Record<string, string | number> = {}
  for (const [k, v] of Object.entries(d)) {
    if (estaVacio(v)) continue
    limpio[k] = typeof v === 'string' ? v.trim() : v
  }
  return limpio
}

/** Usuario de acceso: letras, números, ".", "_" y "-" (3–50). */
export const REGEX_USUARIO = /^[A-Za-z0-9._-]{3,50}$/

/** Quita los acentos al escribir el usuario de acceso ("José" → "Jose", "Ñandú" → "Nandu"). */
export const sinAcentos = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

/** Correo con forma válida (el backend valida a fondo y que sea único). */
export const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** "Aula B2" → "aula_b2" (igual que el backend normaliza las claves de catálogo). */
export const normalizarClave = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
