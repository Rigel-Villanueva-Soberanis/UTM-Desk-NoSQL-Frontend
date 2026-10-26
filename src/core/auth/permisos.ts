import { normalizarTexto } from '@/core/utils/texto'

export type Rol = 'root' | 'reportante' | 'tecnico' | 'soporte' | 'directivos' | 'administrativos'

/** El token trae "técnico" con acento: siempre normalizar. */
export const normalizarRol = (r: string): Rol => normalizarTexto(r) as Rol

const TODOS: Rol[] = ['root', 'reportante', 'tecnico', 'soporte', 'directivos', 'administrativos']

export const PERMISOS = {
  'incidencias.crear': ['root', 'reportante'],
  'incidencias.ver': TODOS,
  'incidencias.editar': ['root', 'soporte', 'reportante'],
  'incidencias.eliminar': ['root', 'administrativos'],
  'incidencias.evidencias': ['root', 'reportante', 'tecnico'],
  'incidencias.asignar': ['root', 'soporte', 'administrativos'],
  'incidencias.cambiarEstado': ['root', 'soporte', 'administrativos', 'tecnico'],
  'incidencias.seguimiento': ['root', 'tecnico'],
  'incidencias.horas': ['root', 'tecnico'],
  'incidencias.tags': ['root', 'soporte', 'administrativos', 'tecnico'],
  'incidencias.externo': ['root', 'soporte', 'administrativos'],
  'incidencias.buscar': ['root', 'soporte', 'directivos'],
  'analitica.tiempos': ['root', 'directivos'],
  'analitica.eficiencia': ['root', 'administrativos'],
  'usuarios.admin': ['soporte'],
  // Leer catálogos lo puede hacer cualquier rol (el backend lo permite y las listas de los formularios lo necesitan),
  // pero el módulo «Catálogos» (menú y pantallas) es solo para quien puede editarlos: ver «catalogos.editar».
  'catalogos.ver': TODOS,
  'catalogos.editar': ['root', 'soporte'],
  miCuenta: TODOS,
} as const satisfies Record<string, readonly Rol[]>

export type Permiso = keyof typeof PERMISOS

export const puede = (rol: Rol | null, permiso: Permiso) =>
  !!rol && (PERMISOS[permiso] as readonly Rol[]).includes(rol)

export const ETIQUETA_ROL: Record<Rol, string> = {
  root: 'Root',
  reportante: 'Reportante',
  tecnico: 'Técnico',
  soporte: 'Soporte de TI',
  directivos: 'Directivos',
  administrativos: 'Administrativos',
}

/** Pantalla de inicio después del login (si la ruta aún no existe, se usa "/"). */
export const INICIO_POR_ROL: Record<Rol, string> = {
  reportante: '/incidencias',
  tecnico: '/incidencias',
  soporte: '/bandeja',
  administrativos: '/bandeja',
  directivos: '/analitica/tiempos',
  root: '/incidencias',
}
