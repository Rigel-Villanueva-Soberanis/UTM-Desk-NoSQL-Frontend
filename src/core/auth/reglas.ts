import type { Incidencia } from '@/modules/incidencias/types/incidencia.types'
import type { UsuarioSesion } from './sesion.store'

/**
 * Reglas POR INCIDENCIA (además del permiso del rol): si es suya, si está asignada a mí, si ya cerró.
 * Ocultar botones es comodidad, no seguridad: el backend siempre valida (403).
 */
const cerrada = (i: Incidencia) => i.estado === 'resuelta' || i.estado === 'cancelada'
const esMia = (i: Incidencia, u: UsuarioSesion) => i.datosReportante.idUsuario === u.id
const asignadaAMi = (i: Incidencia, u: UsuarioSesion) => i.tecnicoAsignado?.idUsuario === u.id

export const reglas = {
  editar: (i: Incidencia, u: UsuarioSesion) => u.rol !== 'reportante' || (esMia(i, u) && i.estado === 'abierta'),
  evidencias: (i: Incidencia, u: UsuarioSesion) =>
    !cerrada(i) && (u.rol === 'reportante' ? esMia(i, u) : u.rol === 'tecnico' ? asignadaAMi(i, u) : true),
  asignar: (i: Incidencia) => !cerrada(i),
  cambiarEstado: (i: Incidencia, u: UsuarioSesion) => u.rol !== 'tecnico' || asignadaAMi(i, u),
  seguimiento: (i: Incidencia, u: UsuarioSesion) => !cerrada(i) && (u.rol !== 'tecnico' || asignadaAMi(i, u)),
  horas: (i: Incidencia, u: UsuarioSesion) => !cerrada(i) && (u.rol !== 'tecnico' || asignadaAMi(i, u)),
  tags: (i: Incidencia, u: UsuarioSesion) => u.rol !== 'tecnico' || asignadaAMi(i, u),
  externo: (i: Incidencia) => !cerrada(i),
} satisfies Record<string, (i: Incidencia, u: UsuarioSesion) => boolean>

/** Estados a los que puede pasar el técnico. Root/Sop/Adm: cualquiera. */
export const flujoTecnico: Record<string, string[]> = {
  abierta: ['en proceso'],
  'en proceso': ['resuelta'],
}
