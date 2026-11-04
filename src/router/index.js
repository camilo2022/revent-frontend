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

// Rutas de lista/crear/ver/editar de un recurso genérico (views/Resources)
const crudRoutes = (key, path, title, perm) => {
  const page = (name) => () => import(`@/views/Resources/Resource${name}.vue`)
  const meta = (t, a) => ({ title: t, permission: `${perm}.${a}`, ...(t === title ? {} : { parent: { title, to: `/${path.split('/:')[0]}` } }) })
  return [
    { path, component: page('List'), props: { resource: key }, meta: meta(title, 'all') },
    { path: `${path}/create`, component: page('Form'), props: { resource: key }, meta: meta('Nuevo', 'store') },
    { path: `${path}/:id`, component: page('Show'), props: (r) => ({ resource: key, id: r.params.id }), meta: meta('Detalle', 'find') },
    { path: `${path}/:id/edit`, component: page('Form'), props: (r) => ({ resource: key, id: r.params.id }), meta: meta('Editar', 'update') },
  ]
}
const assign = () => import('@/views/Security/PermissionAssign.vue')
const simpleCatalogs = {
  genders: ['Géneros', 'genders.all'], blood_types: ['Tipos de sangre', 'blood_types.all'], health_entities: ['Entidades de salud', 'health_entities.all'],
  pension_funds: ['Fondos de pensión', 'pension_funds.all'], compensation_funds: ['Cajas de compensación', 'compensation_funds.all'],
  risk_managers: ['Administradoras de riesgos', 'risk_managers.all'], file_types: ['Tipos de archivo', 'file_types.all'],
  person_types: ['Tipos de persona', 'identification.person_types.all'], document_types: ['Tipos de documento', 'identification.document_types.all'],
  areas: ['Áreas', 'organizational_structure.areas.all'], positions: ['Cargos', 'organizational_structure.areas.positions.all'],
  categories: ['Categorías', 'classification.categories.all'], subcategories: ['Subcategorías', 'classification.subcategories.all'],
}
children.push(
  ...crudRoutes('people', 'people', 'Personas', 'people'),
  ...crudRoutes('employees', 'employees', 'Empleados', 'employees'),
  ...crudRoutes('users', 'users', 'Usuarios', 'users'),
  ...crudRoutes('suppliers', 'suppliers', 'Proveedores', 'suppliers'),
  ...crudRoutes('stores', 'stores', 'Tiendas', 'stores'),
  ...crudRoutes('roles', 'roles', 'Roles', 'authorization.roles'),
  ...crudRoutes('permissions', 'permissions', 'Permisos', 'authorization.permissions'),
  ...crudRoutes('modules', 'modules', 'Módulos', 'navegation.modules'),
  ...crudRoutes('submodules', 'modules/:moduleId/submodules', 'Submódulos', 'navegation.modules.submodules'),
  // Catálogos simples con CRUD en modal
  ...Object.entries(simpleCatalogs).map(([key, [title, permission]]) => ({ path: key, component: CatalogPage, props: { catalog: key }, meta: { title, permission } })),
  // Asignaciones con casillas
  { path: 'users/:id/permissions', component: assign, props: (r) => ({ kind: 'users', id: r.params.id }), meta: { title: 'Permisos', permission: 'users.authorization.assign', parent: { title: 'Usuarios', to: '/users' } } },
  { path: 'positions/:id/permissions', component: assign, props: (r) => ({ kind: 'positions', id: r.params.id }), meta: { title: 'Permisos', permission: 'organizational_structure.areas.positions.authorization.assign', parent: { title: 'Cargos', to: '/positions' } } },
  { path: 'categories/:id/subcategories', component: assign, props: (r) => ({ kind: 'categories', id: r.params.id }), meta: { title: 'Subcategorías', permission: 'classification.categories.subcategories.assign', parent: { title: 'Categorías', to: '/categories' } } },
  // Ubicaciones (solo lectura)
  { path: 'locations', redirect: '/locations/countries' },
  { path: 'locations/:kind', component: () => import('@/views/Resources/Locations.vue'), meta: { title: 'Ubicaciones' } },
  { path: 'locations/:kind/:id', component: () => import('@/views/Resources/ResourceShow.vue'), props: (r) => ({ resource: r.params.kind, id: r.params.id }), meta: { title: 'Detalle', parent: { title: 'Ubicaciones', to: '/locations' } } },
  // Auditoría y perfil
  { path: 'audits', component: () => import('@/views/Audits/List.vue'), meta: { title: 'Auditoría', permission: 'audits.all' } },
  { path: 'audits/:id', component: () => import('@/views/Audits/Show.vue'), props: true, meta: { title: 'Detalle', permission: 'audits.find', parent: { title: 'Auditoría', to: '/audits' } } },
  { path: 'profile', component: () => import('@/views/pages/Profile.vue'), meta: { title: 'Mi perfil' } },
)

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
