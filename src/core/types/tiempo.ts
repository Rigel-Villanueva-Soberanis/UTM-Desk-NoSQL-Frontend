/** Tiempo tal como lo entrega el backend: enteros y el texto ya listo para mostrar («1 h 30 min»). */
export interface Tiempo {
  horas: number
  minutos: number
  texto: string
}

/** Texto «1 h 30 min» a partir de horas y minutos (por si el backend no manda `texto`). */
export function textoTiempo(horas: number, minutos: number): string {
  if (!horas && !minutos) return '0 min'
  return [horas ? `${horas} h` : '', minutos ? `${minutos} min` : ''].filter(Boolean).join(' ')
}

/** Deja un valor del backend con forma de `Tiempo` (si falta o viene raro, 0 min). */
export function normalizarTiempo(v: unknown): Tiempo {
  const t = (v ?? {}) as Partial<Tiempo>
  const horas = Number.isFinite(Number(t.horas)) ? Math.trunc(Number(t.horas)) : 0
  const minutos = Number.isFinite(Number(t.minutos)) ? Math.trunc(Number(t.minutos)) : 0
  return { horas, minutos, texto: typeof t.texto === 'string' && t.texto ? t.texto : textoTiempo(horas, minutos) }
}

/** Para ejes de gráficas: horas con decimales (horas + minutos / 60). */
export const aHoras = (t: Pick<Tiempo, 'horas' | 'minutos'>) => Number((t.horas + t.minutos / 60).toFixed(2))
