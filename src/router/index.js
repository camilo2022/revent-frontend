import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const DefaultLayout = () => import('@/layout/DefaultLayout.vue')
const CatalogPage = () => import('@/views/Catalogs/CatalogPage.vue')

// Rutas hijas del layout; meta.permission restringe el acceso, meta.crumbs arma las migas de pan
const children = [
  { path: '', name: 'dashboard', component: () => import('@/views/pages/Dashboard.vue'), meta: { title: 'Inicio' } },

  // Catálogos con CRUD genérico (la clave apunta a catalogs.config.js)
  { path: 'colors', component: CatalogPage, props: { catalog: 'colors' }, meta: { title: 'Colores', permission: 'colors.all' } },
  { path: 'sizes', component: CatalogPage, props: { catalog: 'sizes' }, meta: { title: 'Tallas', permission: 'sizes.all' } },
  { path: 'trademarks', component: CatalogPage, props: { catalog: 'trademarks' }, meta: { title: 'Marcas', permission: 'trademarks.all' } },
  { path: 'collections', component: CatalogPage, props: { catalog: 'collections' }, meta: { title: 'Colecciones', permission: 'collections.all' } },

  // Productos
  { path: 'products', component: () => import('@/views/Products/List.vue'), meta: { title: 'Productos', permission: 'products.all' } },
  { path: 'products/create', component: () => import('@/views/Products/Create.vue'), meta: { title: 'Nuevo', permission: 'products.store', parent: { title: 'Productos', to: '/products' } } },
  { path: 'products/:id', component: () => import('@/views/Products/Show.vue'), props: true, meta: { title: 'Detalle', permission: 'products.find', parent: { title: 'Productos', to: '/products' } } },
  { path: 'products/:id/edit', component: () => import('@/views/Products/Edit.vue'), props: true, meta: { title: 'Editar', permission: 'products.update', parent: { title: 'Productos', to: '/products' } } },

  // Fichas técnicas
  { path: 'technical_sheets', component: () => import('@/views/TechnicalSheets/List.vue'), meta: { title: 'Fichas técnicas', permission: 'technical_sheets.all' } },
  { path: 'technical_sheets/create', component: () => import('@/views/TechnicalSheets/Create.vue'), meta: { title: 'Nueva', permission: 'technical_sheets.store', parent: { title: 'Fichas técnicas', to: '/technical_sheets' } } },
  { path: 'technical_sheets/:id', component: () => import('@/views/TechnicalSheets/Show.vue'), props: true, meta: { title: 'Detalle', permission: 'technical_sheets.find', parent: { title: 'Fichas técnicas', to: '/technical_sheets' } } },
  { path: 'technical_sheets/:id/edit', component: () => import('@/views/TechnicalSheets/Edit.vue'), props: true, meta: { title: 'Editar', permission: 'technical_sheets.update', parent: { title: 'Fichas técnicas', to: '/technical_sheets' } } },

  // Órdenes de producción
  { path: 'production_orders', component: () => import('@/views/ProductionOrders/List.vue'), meta: { title: 'Órdenes de producción', permission: 'production_orders.all' } },
  { path: 'production_orders/create', component: () => import('@/views/ProductionOrders/Create.vue'), meta: { title: 'Nueva', permission: 'production_orders.store', parent: { title: 'Órdenes de producción', to: '/production_orders' } } },
  { path: 'production_orders/:id', component: () => import('@/views/ProductionOrders/Show.vue'), props: true, meta: { title: 'Detalle', permission: 'production_orders.find', parent: { title: 'Órdenes de producción', to: '/production_orders' } } },
  { path: 'production_orders/:id/edit', component: () => import('@/views/ProductionOrders/Edit.vue'), props: true, meta: { title: 'Editar', permission: 'production_orders.update', parent: { title: 'Órdenes de producción', to: '/production_orders' } } },
]

const errorPage = (code) => ({
  path: `/${code}`,
  component: () => import('@/views/pages/ErrorPage.vue'),
  props: { code },
  meta: { public: true },
})

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('@/views/pages/Login.vue'), meta: { public: true } },
    { path: '/', component: DefaultLayout, children },
    errorPage(403),
    errorPage(404),
    errorPage(500),
    { path: '/:pathMatch(.*)*', redirect: '/404' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

// Guard: sin token solo se entra a rutas públicas; con permiso se valida por ruta
router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (to.meta.public) {
    return to.path === '/login' && auth.token ? '/' : true
  }
  if (!auth.token) return '/login'

  // Carga usuario, permisos y menú una vez por recarga de página
  if (!auth.loaded) {
    try {
      await auth.fetchUser()
    } catch {
      auth.clear()
      return '/login'
    }
  }

  const permission = to.meta.permission
  if (permission && !auth.can(permission)) return '/403'
  return true
})

export default router
