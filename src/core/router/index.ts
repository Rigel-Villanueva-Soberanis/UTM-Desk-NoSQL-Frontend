import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { instalarGuard } from './guard'

// Cada módulo exporta su `routes.ts` (arreglo de rutas); se juntan solas, sin registrarlas a mano.
const archivos = import.meta.glob<{ default: RouteRecordRaw[] }>('@/modules/*/routes.ts', {
  eager: true,
})
const delModulo = Object.values(archivos).flatMap((m) => m.default)

const publicas = delModulo.filter((r) => r.meta?.publica)
const privadas = delModulo.filter((r) => !r.meta?.publica)

const rutas: RouteRecordRaw[] = [
  ...publicas,
  {
    path: '/',
    component: () => import('@/core/layout/AppLayout.vue'),
    children: [
      { path: '', name: 'inicio', component: () => import('@/core/layout/InicioView.vue') },
      ...privadas,
      {
        path: 'sin-permiso',
        name: 'sin-permiso',
        component: () => import('@/shared/components/SinPermiso.vue'),
      },
      {
        path: ':pathMatch(.*)*',
        name: 'no-encontrado',
        component: () => import('@/shared/components/NoEncontrado.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: rutas,
})

instalarGuard(router)

// Título de la pestaña: "Usuarios · UTM Desk".
router.afterEach((to) => {
  const t = to.meta.titulo
  document.title = t ? `${t} · UTM Desk` : 'UTM Desk'
})

export default router
