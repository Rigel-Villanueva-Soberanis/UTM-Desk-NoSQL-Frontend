import type { RouteRecordRaw } from 'vue-router'

const rutas: RouteRecordRaw[] = [
  {
    path: '/usuarios',
    name: 'usuarios',
    component: () => import('./views/UsuariosView.vue'),
    meta: { permiso: 'usuarios.admin', titulo: 'Usuarios' },
  },
  // Crear y editar se hacen en un modal dentro de /usuarios; estas rutas solo redirigen enlaces viejos.
  { path: '/usuarios/:id', redirect: '/usuarios' },
]

export default rutas
