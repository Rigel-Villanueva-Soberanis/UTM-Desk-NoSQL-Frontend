import type { Permiso, Rol } from '@/core/auth/permisos'

export interface OpcionMenu {
  texto: string
  /** Texto alterno según el rol (misma pantalla, otro título). */
  textoPorRol?: Partial<Record<Rol, string>>
  icono: string
  ruta: string
  permiso: Permiso
}

export const MENU: OpcionMenu[] = [
  { texto: 'Reportar falla', icono: 'pi pi-plus-circle', ruta: '/incidencias/nueva', permiso: 'incidencias.crear' },
  {
    texto: 'Incidencias',
    textoPorRol: { reportante: 'Mis reportes', tecnico: 'Mi mesa de trabajo' },
    icono: 'pi pi-list',
    ruta: '/incidencias',
    permiso: 'incidencias.ver',
  },
  { texto: 'Bandeja sin asignar', icono: 'pi pi-inbox', ruta: '/bandeja', permiso: 'incidencias.asignar' },
  { texto: 'Búsqueda', icono: 'pi pi-search', ruta: '/busqueda', permiso: 'incidencias.buscar' },
  { texto: 'Tiempos por edificio', icono: 'pi pi-clock', ruta: '/analitica/tiempos', permiso: 'analitica.tiempos' },
  { texto: 'Eficiencia global', icono: 'pi pi-chart-bar', ruta: '/analitica/eficiencia', permiso: 'analitica.eficiencia' },
  { texto: 'Usuarios', icono: 'pi pi-users', ruta: '/usuarios', permiso: 'usuarios.admin' },
  { texto: 'Catálogos', icono: 'pi pi-book', ruta: '/catalogos', permiso: 'catalogos.editar' },
  { texto: 'Mi cuenta', icono: 'pi pi-user', ruta: '/mi-cuenta', permiso: 'miCuenta' },
]
