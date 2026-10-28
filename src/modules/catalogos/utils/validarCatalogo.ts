import { normalizarTexto } from '@/core/utils/texto'
import { LIMITES, limpiarEspacios, sinControl } from '@/core/utils/validacion'
import {
  ROLES_FIJOS,
  TIPOS_INPUT,
  type CampoDinamico,
  type Categoria,
  type ClaveCatalogo,
  type Edificio,
  type RolCatalogo,
} from '../types/catalogo.types'

/** Clave de un elemento: minúsculas, números y guion bajo. */
export const REGEX_CLAVE = /^[a-z0-9_]+$/

type Errores = Record<string, string>
const texto = (t: unknown) => limpiarEspacios(sinControl(typeof t === 'string' ? t : ''))

const largo = (e: Errores, campo: string, nombre: string, valor: string, max: number) => {
  if (!valor) e[campo] = `${nombre} es obligatorio.`
  else if (valor.length > max) e[campo] = `${nombre} admite hasta ${max} caracteres.`
}

function validarClave(e: Errores, clave: string, existentes: string[], campo = 'clave') {
  if (!clave) e[campo] = 'La clave es obligatoria.'
  else if (clave.length > LIMITES.claveCatalogo.max) e[campo] = `La clave admite hasta ${LIMITES.claveCatalogo.max} caracteres.`
  else if (!REGEX_CLAVE.test(clave)) e[campo] = 'Usa solo minúsculas, números y guion bajo (ej. aula_b2).'
  else if (existentes.includes(clave)) e[campo] = 'Ya existe un elemento con esa clave.'
}

/** Errores de una lista de salones (vacíos, demasiado largos o repetidos sin importar mayúsculas/acentos). `ya` = los que el edificio ya tiene. */
export function validarSalones(salones: string[], ya: string[] = []): string {
  const l = salones.map(texto)
  if (l.some((x) => !x)) return 'Hay salones vacíos.'
  if (l.some((x) => x.length > LIMITES.textoCatalogo.max)) return `Cada salón admite hasta ${LIMITES.textoCatalogo.max} caracteres.`
  const vistos = new Set(ya.map(normalizarTexto))
  for (const x of l) {
    const k = normalizarTexto(x)
    if (vistos.has(k)) return `El salón «${x}» ya existe o está repetido.`
    vistos.add(k)
  }
  return ''
}

export function validarEdificio(v: { clave: string; edificio: string; salones: string[] }, clavesExistentes: string[], esNuevo: boolean): Errores {
  const e: Errores = {}
  if (esNuevo) validarClave(e, v.clave.trim(), clavesExistentes)
  largo(e, 'edificio', 'El edificio', texto(v.edificio), LIMITES.textoCatalogo.max)
  const s = validarSalones(v.salones)
  if (s) e.salones = s
  return e
}

/** Errores de la lista de campos dinámicos. Claves: `campos_dinamicos[i].campo` o `campos_dinamicos`. */
export function validarCampos(campos: CampoDinamico[]): Errores {
  const e: Errores = {}
  const vistas = new Set<string>()
  campos.forEach((c, i) => {
    const p = `campos_dinamicos[${i}]`
    const clave = c.clave.trim()
    if (!clave) e[`${p}.clave`] = 'La clave es obligatoria.'
    else if (!REGEX_CLAVE.test(clave) || clave.length > LIMITES.claveCatalogo.max)
      e[`${p}.clave`] = 'Minúsculas, números y guion bajo (máx. 50).'
    else if (vistas.has(clave)) e[`${p}.clave`] = 'Esa clave está repetida.'
    vistas.add(clave)

    const et = texto(c.etiqueta)
    largo(e, `${p}.etiqueta`, 'La etiqueta', et, LIMITES.textoCatalogo.max)
    if (!TIPOS_INPUT.some((t) => t.valor === c.tipo_input)) e[`${p}.tipo_input`] = 'Tipo no válido.'
    if (c.tipo_input === 'select') {
      const ops = (c.opciones ?? []).map(texto)
      if (!ops.length) e[`${p}.opciones`] = 'Agrega al menos una opción.'
      else if (ops.some((o) => !o)) e[`${p}.opciones`] = 'Hay opciones vacías.'
      else if (ops.some((o) => o.length > LIMITES.opcionCampo.max)) e[`${p}.opciones`] = `Cada opción admite hasta ${LIMITES.opcionCampo.max} caracteres.`
      else if (new Set(ops.map(normalizarTexto)).size !== ops.length) e[`${p}.opciones`] = 'Hay opciones repetidas.'
    }
  })
  return e
}

export function validarCategoria(v: { clave: string; nombre: string; campos_dinamicos: CampoDinamico[] }, clavesExistentes: string[], esNueva: boolean): Errores {
  const e: Errores = {}
  if (esNueva) validarClave(e, v.clave.trim(), clavesExistentes)
  largo(e, 'nombre', 'El nombre', texto(v.nombre), LIMITES.textoCatalogo.max)
  Object.assign(e, validarCampos(v.campos_dinamicos))
  return e
}

export function validarClasificaciones(lista: string[], requiere: boolean): string {
  const l = lista.map(texto)
  if (requiere && !l.length) return 'Este rol requiere al menos una clasificación.'
  if (l.some((x) => !x)) return 'Hay clasificaciones vacías.'
  if (l.some((x) => x.length > LIMITES.textoCatalogo.max)) return `Cada clasificación admite hasta ${LIMITES.textoCatalogo.max} caracteres.`
  if (new Set(l.map(normalizarTexto)).size !== l.length) return 'Hay clasificaciones repetidas.'
  return ''
}

/** Limpia un campo dinámico para enviarlo (espacios, opciones solo si es select). */
export function limpiarCampo(c: CampoDinamico): CampoDinamico {
  const base: CampoDinamico = { clave: c.clave.trim(), etiqueta: texto(c.etiqueta), tipo_input: c.tipo_input, requerido: !!c.requerido }
  if (c.tipo_input === 'select') base.opciones = (c.opciones ?? []).map(texto)
  return base
}
