import type { RouteRecordRaw } from 'vue-router'

const rutas: RouteRecordRaw[] = [
  {
    path: '/catalogos',
    name: 'catalogos',
    component: () => import('./views/CatalogosView.vue'),
    meta: { permiso: 'catalogos.editar', titulo: 'Catálogos' },
  },
  {
    path: '/catalogos/:clave',
    name: 'catalogo-detalle',
    component: () => import('./views/CatalogoDetalleView.vue'),
    props: true,
    meta: { permiso: 'catalogos.editar', titulo: 'Catálogo' },
  },
]
export default rutas
