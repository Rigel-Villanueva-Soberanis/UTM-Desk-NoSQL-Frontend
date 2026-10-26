/** ISO 8601 en UTC → fecha y hora local (es-MX). */
export function formatearFecha(isoUtc: string | null | undefined): string {
  if (!isoUtc) return '—'
  return new Date(isoUtc).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
}

const dos = (n: number) => String(n).padStart(2, '0')

/** Date (calendario del usuario) → "AAAA-MM-DD" con el día local, sin correrse por UTC. */
export const aFechaIso = (d: Date) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`

/** "AAAA-MM-DD" → Date a medianoche local (o null). */
export function desdeFechaIso(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null
}

/** Solo el día, en hora local: "20 oct 2026". */
export function formatearDia(isoUtc: string | null | undefined): string {
  if (!isoUtc) return '—'
  return new Date(isoUtc).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Solo la hora, en hora local: "09:00". */
export function formatearHora(isoUtc: string | null | undefined): string {
  if (!isoUtc) return ''
  return new Date(isoUtc).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
}
