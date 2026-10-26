import type { RouteRecordRaw } from 'vue-router'

const rutas: RouteRecordRaw[] = [
  {
    path: '/incidencias',
    name: 'incidencias',
    component: () => import('./listado/views/ListadoView.vue'),
    meta: { permiso: 'incidencias.ver', titulo: 'Incidencias' },
  },
  {
    path: '/bandeja',
    name: 'bandeja',
    component: () => import('./listado/views/BandejaView.vue'),
    meta: { permiso: 'incidencias.asignar', titulo: 'Bandeja sin asignar' },
  },
  {
    path: '/incidencias/nueva',
    name: 'reportar',
    component: () => import('./reportar/views/ReportarView.vue'),
    meta: { permiso: 'incidencias.crear', titulo: 'Reportar falla' },
  },
  {
    // Después de '/incidencias/nueva': la ruta fija tiene prioridad sobre ':id'.
    path: '/incidencias/:id',
    name: 'expediente',
    component: () => import('./expediente/views/ExpedienteView.vue'),
    props: true,
    meta: { permiso: 'incidencias.ver', titulo: 'Expediente' },
  },
]

export default rutas
