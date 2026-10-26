import type { RouteRecordRaw } from 'vue-router'

const rutas: RouteRecordRaw[] = [
  {
    path: '/busqueda',
    name: 'busqueda',
    component: () => import('./views/BusquedaView.vue'),
    meta: { permiso: 'incidencias.buscar', titulo: 'Búsqueda' },
  },
  {
    path: '/analitica/tiempos',
    name: 'tiempos',
    component: () => import('./views/TiemposView.vue'),
    meta: { permiso: 'analitica.tiempos', titulo: 'Tiempos por edificio' },
  },
  {
    path: '/analitica/eficiencia',
    name: 'eficiencia',
    component: () => import('./views/EficienciaView.vue'),
    meta: { permiso: 'analitica.eficiencia', titulo: 'Eficiencia global' },
  },
]

export default rutas
