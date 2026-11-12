import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { integrationScreens } from '@/config/integrationScreens'

// Una ruta por recurso: path => [Controlador, título, permiso]. Crear/editar/ver son paneles dentro del controlador.
const resources = {
  Setting: {
    users: ['User', 'Usuarios', 'users.all'], people: ['Person', 'Personas', 'people.all'], employees: ['Employee', 'Empleados', 'employees.all'],
    roles: ['Role', 'Roles', 'authorization.roles.all'],
    modules: ['Module', 'Módulos', 'navegation.modules.all'],
  },
  Administration: {
    areas: ['Area', 'Áreas', 'organizational_structure.areas.all'], positions: ['Position', 'Cargos', 'organizational_structure.areas.positions.all'],
    genders: ['Gender', 'Géneros', 'genders.all'], blood_types: ['BloodType', 'Tipos de sangre', 'blood_types.all'],
    risk_managers: ['RiskManager', 'Administradoras de riesgos', 'risk_managers.all'], health_entities: ['HealthEntity', 'Entidades de salud', 'health_entities.all'],
    compensation_funds: ['CompensationFund', 'Cajas de compensación', 'compensation_funds.all'], pension_funds: ['PensionFund', 'Fondos de pensión', 'pension_funds.all'],
    file_types: ['FileType', 'Tipos de archivo', 'file_types.all'], person_types: ['PersonType', 'Tipos de persona', 'identification.person_types.all'],
    locations: ['Location', 'Ubicaciones', ''],
  },
  Production: {
    collections: ['Collection', 'Colecciones', 'collections.all'], products: ['Product', 'Productos', 'products.all'],
    technical_sheets: ['TechnicalSheet', 'Fichas técnicas', 'technical_sheets.all'], production_orders: ['ProductionOrder', 'Órdenes de producción', 'production_orders.all'],
    colors: ['Color', 'Colores', 'colors.all'], sizes: ['Size', 'Tallas', 'sizes.all'], trademarks: ['Trademark', 'Marcas', 'trademarks.all'],
    categories: ['Category', 'Categorías', 'categorization.categories.all'],
    suppliers: ['Supplier', 'Proveedores', 'suppliers.all'], stores: ['Store', 'Tiendas', 'stores.all'],
    reports: ['Report', 'Reportes', 'reports.all'],
  },
}

// Integraciones: una ruta por pantalla de config/integrationScreens.js (las que aún no tienen controlador no se registran)
const integrationControllers = import.meta.glob('./components/controllers/Integration/*Controller.vue')
const integrationRoutes = Object.entries(integrationScreens)
  .map(([slug, [name, title, permission, , siigo = []]]) => ({
    path: `integration/${slug}`,
    component: integrationControllers[`./components/controllers/Integration/${name}Controller.vue`],
    meta: { title, permission, siigo },
  }))
  .filter((route) => route.component)

const children = [
  { path: '', name: 'dashboard', component: () => import('@/pages/Dashboard.vue'), meta: { title: 'Inicio' } },
  { path: 'profile', component: () => import('@/pages/Profile.vue'), meta: { title: 'Mi perfil' } },
  { path: 'siigo_authorization', component: () => import('@/pages/SiigoAuthorization.vue'), meta: { title: 'Autorización Siigo' } },
  ...integrationRoutes,
  ...Object.entries(resources).flatMap(([group, items]) =>
    Object.entries(items).map(([path, [name, title, permission]]) => ({
      path,
      component: () => import(`./components/controllers/${group}/${name}Controller.vue`),
      meta: { title, permission },
    })),
  ),
]

const errorPage = (code) => ({ path: `/${code}`, component: () => import('@/pages/ErrorPage.vue'), props: { code }, meta: { public: true } })

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('@/pages/Login.vue'), meta: { public: true } },
    { path: '/', component: () => import('@/components/layout/DefaultLayout.vue'), children },
    errorPage(401), errorPage(403), errorPage(404), errorPage(500),
    { path: '/:pathMatch(.*)*', redirect: '/404' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

// Guard: sin token solo se entra a rutas públicas; luego se valida el permiso de la ruta
router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (to.meta.public) return to.path === '/login' && auth.token ? '/' : true
  if (!auth.token) return '/401'

  // Carga usuario, permisos y menú una vez por recarga de página
  if (!auth.loaded) {
    try {
      await auth.fetchUser()
    } catch {
      auth.clear()
      return '/login'
    }
  }
  if (to.meta.permission && !auth.can(to.meta.permission)) return '/403'
  return true
})

export default router
