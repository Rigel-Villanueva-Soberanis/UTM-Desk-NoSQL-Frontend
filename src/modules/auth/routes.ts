import type { RouteRecordRaw } from 'vue-router'

const rutas: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('./views/LoginView.vue'),
    meta: { publica: true, titulo: 'Iniciar sesión' },
  },
]

export default rutas
