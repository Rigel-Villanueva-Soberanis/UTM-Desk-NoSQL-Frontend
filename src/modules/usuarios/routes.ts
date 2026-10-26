import type { RouteRecordRaw } from 'vue-router'

const rutas: RouteRecordRaw[] = [
  {
    path: '/usuarios',
    name: 'usuarios',
    component: () => import('./views/UsuariosView.vue'),
    meta: { permiso: 'usuarios.admin', titulo: 'Usuarios' },
  },
  {
    // Antes de '/usuarios/:id': la ruta fija tiene prioridad sobre el parámetro.
    path: '/usuarios/nuevo',
    name: 'usuario-nuevo',
    component: () => import('./views/UsuarioFormView.vue'),
    meta: { permiso: 'usuarios.admin', titulo: 'Nuevo usuario' },
  },
  {
    path: '/usuarios/:id',
    name: 'usuario-editar',
    component: () => import('./views/UsuarioFormView.vue'),
    props: true,
    meta: { permiso: 'usuarios.admin', titulo: 'Editar usuario' },
  },
]

export default rutas
