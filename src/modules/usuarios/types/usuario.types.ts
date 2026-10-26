/** Fila de GET /api/Usuario/tecnicos (solo técnicos activos, de menor a mayor carga). */
export interface TecnicoDisponible {
  id: string
  nombreCompleto: string
  /** Especialidad. */
  clasificacion: string | null
  /** Incidencias activas que ya tiene asignadas. */
  incidenciasActivas: number
}

export type EstadoCuenta = 'activo' | 'inactivo' | 'bloqueado'

export const ESTADOS_CUENTA: { valor: EstadoCuenta; etiqueta: string }[] = [
  { valor: 'activo', etiqueta: 'Activo' },
  { valor: 'inactivo', etiqueta: 'Inactivo' },
  { valor: 'bloqueado', etiqueta: 'Bloqueado' },
]

/** Fila de GET /api/Usuario y datos de GET /api/Usuario/{id}. */
export interface Usuario {
  id: string
  nombres: string
  apellidoPaterno: string
  apellidoMaterno: string | null
  nombreCompleto: string
  usuario: string
  correo: string
  estadoCuenta: string
  rolSistema: string
  clasificacionRol: string | null
  fechaCreacion: string
}

/** Body de POST /api/Usuario. */
export interface NuevoUsuario {
  nombres: string
  apellidoPaterno: string
  apellidoMaterno?: string
  usuario: string
  correo: string
  password: string
  rolSistema: string
  clasificacionRol?: string
}

/** Body de PUT /api/Usuario/{id}: igual que crear pero sin `usuario` ni `password`, y con `estadoCuenta`. */
export interface EdicionUsuario {
  nombres: string
  apellidoPaterno: string
  apellidoMaterno?: string
  correo: string
  estadoCuenta: string
  rolSistema: string
  clasificacionRol?: string
}

/** Filtros de GET /api/Usuario (mismos nombres que el query string y la URL). */
export interface FiltrosUsuarios {
  pagina: number
  tamanoPagina: number
  busqueda: string
  nombres: string
  apellidos: string
  rol: string
  clasificacion: string
  estadoCuenta: string
}

export const FILTROS_USUARIOS_VACIOS: FiltrosUsuarios = {
  pagina: 1,
  tamanoPagina: 10,
  busqueda: '',
  nombres: '',
  apellidos: '',
  rol: '',
  clasificacion: '',
  estadoCuenta: '',
}
