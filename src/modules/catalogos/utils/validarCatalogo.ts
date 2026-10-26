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

/**
 * Validación del "editor avanzado" (reemplazar todo). Devuelve un mensaje o '' si es válido.
 * Revisa estructura, claves únicas y, en roles, que sigan los 6 roles fijos.
 */
export function validarContenido(clave: ClaveCatalogo, contenido: unknown): string {
  if (!Array.isArray(contenido)) return 'El contenido debe ser una lista (un arreglo JSON).'
  if (!contenido.length) return 'El contenido no puede quedar vacío.'
  const objeto = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x)
  const claves = new Set<string>()

  for (let i = 0; i < contenido.length; i++) {
    const x = contenido[i]
    const n = `Elemento ${i + 1}`
    if (!objeto(x)) return `${n}: debe ser un objeto.`

    if (clave === 'roles_sistema') {
      const r = x as Partial<RolCatalogo>
      if (typeof r.rol !== 'string' || !r.rol.trim()) return `${n}: falta el rol.`
      if (typeof r.requiere_clasificacion !== 'boolean') return `${n} (${r.rol}): «requiere_clasificacion» debe ser true o false.`
      if (!Array.isArray(r.clasificaciones_permitidas) || r.clasificaciones_permitidas.some((c) => typeof c !== 'string'))
        return `${n} (${r.rol}): «clasificaciones_permitidas» debe ser una lista de textos.`
      const err = validarClasificaciones(r.clasificaciones_permitidas, r.requiere_clasificacion)
      if (err) return `${n} (${r.rol}): ${err}`
      const k = normalizarTexto(r.rol)
      if (claves.has(k)) return `${n}: el rol «${r.rol}» está repetido.`
      claves.add(k)
      continue
    }

    const c = x as Partial<Edificio & Categoria>
    if (typeof c.clave !== 'string') return `${n}: falta la clave.`
    const e: Errores = {}
    validarClave(e, c.clave, [...claves])
    if (e.clave) return `${n}: ${e.clave}`
    claves.add(c.clave)

    if (clave === 'edificios') {
      if (typeof c.edificio !== 'string') return `${n} (${c.clave}): falta «edificio» (texto).`
      if (c.salones !== undefined && (!Array.isArray(c.salones) || c.salones.some((s) => typeof s !== 'string')))
        return `${n} (${c.clave}): «salones» debe ser una lista de textos.`
      const ee = validarEdificio({ clave: c.clave, edificio: c.edificio, salones: (c.salones as string[] | undefined) ?? [] }, [], false)
      if (Object.values(ee)[0]) return `${n} (${c.clave}): ${Object.values(ee)[0]}`
    } else {
      if (typeof c.nombre !== 'string') return `${n} (${c.clave}): falta «nombre» (texto).`
      if (!Array.isArray(c.campos_dinamicos)) return `${n} (${c.clave}): «campos_dinamicos» debe ser una lista.`
      const campos = c.campos_dinamicos as unknown[]
      for (const [j, cd] of campos.entries()) {
        if (!objeto(cd) || typeof cd.clave !== 'string' || typeof cd.etiqueta !== 'string' || typeof cd.tipo_input !== 'string' || typeof cd.requerido !== 'boolean')
          return `${n} (${c.clave}), campo ${j + 1}: debe tener clave, etiqueta, tipo_input y requerido (true/false).`
        if (cd.opciones !== undefined && (!Array.isArray(cd.opciones) || cd.opciones.some((o) => typeof o !== 'string')))
          return `${n} (${c.clave}), campo ${j + 1}: «opciones» debe ser una lista de textos.`
      }
      const ec = validarCategoria({ clave: c.clave, nombre: c.nombre, campos_dinamicos: campos as CampoDinamico[] }, [], false)
      const primero = Object.entries(ec)[0]
      if (primero) return `${n} (${c.clave}): ${primero[1]}`
    }
  }

  if (clave === 'roles_sistema') {
    // Se compara sin acentos y por prefijo ("Soporte de TI" cuenta como «soporte»).
    const nombres = [...claves]
    const faltan = ROLES_FIJOS.filter((r) => !nombres.some((n) => n === r || n.startsWith(r)))
    if (faltan.length) return `Faltan roles fijos: ${faltan.join(', ')}.`
    if (claves.size !== ROLES_FIJOS.length) return 'Los roles son fijos: no se pueden agregar otros.'
  }
  return ''
}
