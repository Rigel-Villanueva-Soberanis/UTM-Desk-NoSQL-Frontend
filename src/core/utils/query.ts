import type { LocationQuery, LocationQueryRaw } from 'vue-router'

type ValorQuery = LocationQuery[string]

/** Un valor del query string como texto ('' si no viene). */
export function texto(v: ValorQuery | undefined): string {
  const x = Array.isArray(v) ? v[0] : v
  return (x ?? '').slice(0, 200) // una URL manipulada no debe meter textos enormes
}

/** Entero dentro de un rango; si no es válido regresa `defecto`. */
export function entero(v: ValorQuery | undefined, defecto: number, min = 1, max = Number.MAX_SAFE_INTEGER): number {
  const n = Number(texto(v))
  return Number.isInteger(n) && n >= min && n <= max ? n : defecto
}

/** Varios valores permitidos: acepta `?x=a&x=b` y `?x=a,b`; descarta los que no estén en la lista y los repetidos. */
export function variosDe<T extends string>(v: ValorQuery | undefined, permitidos: readonly T[]): T[] {
  const crudos = (Array.isArray(v) ? v : [v]).flatMap((x) => (x ?? '').slice(0, 200).split(','))
  return [...new Set(crudos.map((x) => x.trim()))].filter((x): x is T => (permitidos as readonly string[]).includes(x))
}

export const booleano = (v: ValorQuery | undefined) => texto(v) === 'true'

/** Texto que debe cumplir un patrón (p. ej. una fecha) o '' si no cumple. */
export function conPatron(v: ValorQuery | undefined, patron: RegExp): string {
  const t = texto(v)
  return patron.test(t) ? t : ''
}

/** Texto que debe ser uno de los permitidos o '' si no lo es. */
export function unoDe<T extends string>(v: ValorQuery | undefined, permitidos: readonly T[]): T | '' {
  const t = texto(v) as T
  return permitidos.includes(t) ? t : ''
}

/**
 * Filtros → query string de la URL. Se omiten los vacíos, los `false` y los que valen
 * lo mismo que su valor por defecto (así la URL queda limpia: `?estado=abierta`).
 */
export function aQuery<T extends object>(filtros: T, defectos: T): LocationQueryRaw {
  const q: LocationQueryRaw = {}
  for (const [k, v] of Object.entries(filtros) as [keyof T & string, unknown][]) {
    if (v === '' || v === null || v === undefined || v === false) continue
    if (Array.isArray(v)) {
      if (v.length && JSON.stringify(v) !== JSON.stringify(defectos[k])) q[k] = v.map(String)
      continue
    }
    if (v === defectos[k]) continue
    q[k] = String(v)
  }
  return q
}
