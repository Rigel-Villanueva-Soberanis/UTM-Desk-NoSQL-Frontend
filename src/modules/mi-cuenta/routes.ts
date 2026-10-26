import type { RouteRecordRaw } from 'vue-router'

const rutas: RouteRecordRaw[] = [
  {
    path: '/mi-cuenta',
    name: 'mi-cuenta',
    component: () => import('./views/MiCuentaView.vue'),
    meta: { permiso: 'miCuenta', titulo: 'Mi cuenta' },
  },
]
export default rutas
