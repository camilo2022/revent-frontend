<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  cilSpeedometer, cilColorPalette, cilResizeBoth, cilTag, cilLayers, cilBasket, cilDescription, cilIndustry, cilCircle, cilSettings,
  cilBuilding, cilApplications, cilPeople, cilUser, cilLockLocked, cilShieldAlt, cilList, cilHistory, cilStorage, cilBriefcase,
  cilMedicalCross, cilHome, cilFile, cilLocationPin, cilSitemap, cilCart, cilOptions, cilChartPie,
} from '@coreui/icons'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import logo from '@/assets/brand/revent-logo-white.png'

const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()
const route = useRoute()

// Ícono por ruta del menú
const icons = {
  '/collections': cilLayers, '/products': cilBasket, '/technical_sheets': cilDescription, '/production_orders': cilIndustry,
  '/colors': cilColorPalette, '/sizes': cilResizeBoth, '/trademarks': cilTag, '/categories': cilSitemap, '/subcategories': cilList,
  '/suppliers': cilStorage, '/stores': cilHome, '/people': cilPeople, '/employees': cilBriefcase, '/areas': cilBuilding, '/positions': cilBriefcase,
  '/genders': cilPeople, '/blood_types': cilMedicalCross, '/risk_managers': cilShieldAlt, '/health_entities': cilMedicalCross,
  '/compensation_funds': cilHome, '/pension_funds': cilStorage, '/file_types': cilFile, '/person_types': cilList, '/document_types': cilList,
  '/reports': cilChartPie, '/locations': cilLocationPin, '/users': cilUser, '/roles': cilShieldAlt, '/permissions': cilLockLocked, '/modules': cilApplications,
}

// Ícono de cada módulo
const moduleIcons = { 'Producción': cilIndustry, 'Catálogos': cilTag, 'Comercial': cilCart, 'Reportes': cilChartPie, 'Administración': cilBuilding, 'Parámetros': cilOptions, 'Configuración': cilSettings }
const order = Object.keys(moduleIcons)

// Un módulo se abre solo si la ruta actual es una de sus páginas
const isOpen = (group) => group.items.some((i) => route.path === i.url || route.path.startsWith(`${i.url}/`))

// Menú de respaldo cuando la API no devuelve navegación
const item = (name, url, permission) => ({ name, url, permission })
const fallback = [
  { name: 'Producción', items: [
    item('Colecciones', '/collections', 'collections.all'), item('Productos', '/products', 'products.all'),
    item('Fichas técnicas', '/technical_sheets', 'technical_sheets.all'), item('Órdenes de producción', '/production_orders', 'production_orders.all'),
  ] },
  { name: 'Catálogos', items: [
    item('Colores', '/colors', 'colors.all'), item('Tallas', '/sizes', 'sizes.all'), item('Marcas', '/trademarks', 'trademarks.all'),
    item('Categorías', '/categories', 'categorization.categories.all'),
  ] },
  { name: 'Comercial', items: [item('Proveedores', '/suppliers', 'suppliers.all'), item('Tiendas', '/stores', 'stores.all')] },
  { name: 'Reportes', items: [item('Reportes', '/reports', 'reports.all')] },
  { name: 'Administración', items: [
    item('Personas', '/people', 'people.all'), item('Empleados', '/employees', 'employees.all'),
    item('Áreas', '/areas', 'organizational_structure.areas.all'), item('Cargos', '/positions', 'organizational_structure.areas.positions.all'),
  ] },
  { name: 'Parámetros', items: [
    item('Géneros', '/genders', 'genders.all'), item('Tipos de sangre', '/blood_types', 'blood_types.all'),
    item('Administradoras de riesgos', '/risk_managers', 'risk_managers.all'), item('Entidades de salud', '/health_entities', 'health_entities.all'),
    item('Cajas de compensación', '/compensation_funds', 'compensation_funds.all'), item('Fondos de pensión', '/pension_funds', 'pension_funds.all'),
    item('Tipos de archivo', '/file_types', 'file_types.all'), item('Tipos de persona', '/person_types', 'identification.person_types.all'),
  ] },
  { name: 'Configuración', items: [
    item('Usuarios', '/users', 'users.all'), item('Roles', '/roles', 'authorization.roles.all'),
    item('Módulos', '/modules', 'navegation.modules.all'),
  ] },
]

// Solo se muestran las urls que existen como ruta del frontend
const routeExists = (url) => router.getRoutes().some((r) => r.path === url)

const groups = computed(() => {
  const dynamic = auth.navegation
    .map((m) => ({
      name: m.name,
      items: (m.submodules ?? []).filter((s) => routeExists(s.url)).map((s) => ({ name: s.name, url: s.url })),
    }))
    .filter((g) => g.items.length)
  const rank = (n) => (order.includes(n) ? order.indexOf(n) : order.length)
  if (dynamic.length) return dynamic.sort((a, b) => rank(a.name) - rank(b.name))

  return fallback
    .map((g) => ({ name: g.name, items: g.items.filter((i) => auth.can(i.permission)) }))
    .filter((g) => g.items.length)
})
</script>

<template>
  <CSidebar
    class="border-end"
    colorScheme="dark"
    position="fixed"
    :unfoldable="ui.sidebarUnfoldable"
    :visible="ui.sidebarVisible"
    @visible-change="(value) => (ui.sidebarVisible = value)"
  >
    <CSidebarHeader class="border-bottom">
      <CSidebarBrand to="/" class="gap-2">
        <img :src="logo" alt="Revent" class="brand-logo-img" />
      </CSidebarBrand>
    </CSidebarHeader>

    <CSidebarNav>
      <li class="nav-item">
        <RouterLink to="/" class="nav-link" exact-active-class="active">
          <CIcon :icon="cilSpeedometer" class="nav-icon" /> Inicio
        </RouterLink>
      </li>
      <CNavGroup v-for="group in groups" :key="group.name" compact :visible="isOpen(group)">
        <template #togglerContent>
          <CIcon :icon="moduleIcons[group.name] ?? cilApplications" class="nav-icon" /> {{ group.name }}
        </template>
        <li v-for="item in group.items" :key="item.url" class="nav-item">
          <RouterLink :to="item.url" class="nav-link" active-class="active">
            <span class="nav-icon"><CIcon :icon="icons[item.url] ?? cilCircle" size="sm" /></span> {{ item.name }}
          </RouterLink>
        </li>
      </CNavGroup>
    </CSidebarNav>

    <CSidebarFooter class="border-top d-none d-lg-flex">
      <CSidebarToggler @click="ui.sidebarUnfoldable = !ui.sidebarUnfoldable" />
    </CSidebarFooter>
  </CSidebar>
</template>
