<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  cilSpeedometer, cilColorPalette, cilResizeBoth, cilTag, cilLayers, cilBasket,
  cilDescription, cilIndustry, cilCircle, cilFolder,
} from '@coreui/icons'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import logo from '@/assets/brand/revent-logo.png'

const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()

// Ícono por ruta del menú
const icons = {
  '/colors': cilColorPalette, '/sizes': cilResizeBoth, '/trademarks': cilTag, '/collections': cilLayers,
  '/products': cilBasket, '/technical_sheets': cilDescription, '/production_orders': cilIndustry,
}

// Menú de respaldo cuando la API no devuelve navegación
const item = (name, url, permission) => ({ name, url, permission })
const fallback = [
  { name: 'Configuración', items: [
    item('Usuarios', '/users', 'users.all'), item('Personas', '/people', 'people.all'), item('Empleados', '/employees', 'employees.all'),
    item('Roles', '/roles', 'authorization.roles.all'), item('Permisos', '/permissions', 'authorization.permissions.all'),
    item('Módulos', '/modules', 'navegation.modules.all'), item('Auditoría', '/audits', 'audits.all'),
  ] },
  { name: 'Administración', items: [
    item('Áreas', '/areas', 'organizational_structure.areas.all'), item('Cargos', '/positions', 'organizational_structure.areas.positions.all'),
    item('Géneros', '/genders', 'genders.all'), item('Tipos de sangre', '/blood_types', 'blood_types.all'),
    item('Administradoras de riesgos', '/risk_managers', 'risk_managers.all'), item('Entidades de salud', '/health_entities', 'health_entities.all'),
    item('Cajas de compensación', '/compensation_funds', 'compensation_funds.all'), item('Fondos de pensión', '/pension_funds', 'pension_funds.all'),
    item('Tipos de archivo', '/file_types', 'file_types.all'), item('Tipos de persona', '/person_types', 'identification.person_types.all'),
    item('Tipos de documento', '/document_types', 'identification.document_types.all'), item('Ubicaciones', '/locations', ''),
  ] },
  { name: 'Producción', items: [
    item('Colecciones', '/collections', 'collections.all'), item('Productos', '/products', 'products.all'),
    item('Fichas técnicas', '/technical_sheets', 'technical_sheets.all'), item('Órdenes de producción', '/production_orders', 'production_orders.all'),
    item('Colores', '/colors', 'colors.all'), item('Tallas', '/sizes', 'sizes.all'), item('Marcas', '/trademarks', 'trademarks.all'),
    item('Categorías', '/categories', 'classification.categories.all'), item('Subcategorías', '/subcategories', 'classification.subcategories.all'),
    item('Proveedores', '/suppliers', 'suppliers.all'), item('Tiendas', '/stores', 'stores.all'),
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
  if (dynamic.length) return dynamic

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
        <img :src="logo" alt="Revent" height="28" />
        <span class="fw-semibold">TechRevent</span>
      </CSidebarBrand>
    </CSidebarHeader>

    <CSidebarNav>
      <li class="nav-item">
        <RouterLink to="/" class="nav-link" exact-active-class="active">
          <CIcon :icon="cilSpeedometer" class="nav-icon" /> Inicio
        </RouterLink>
      </li>
      <CNavGroup v-for="group in groups" :key="group.name" :visible="true">
        <template #togglerContent>
          <CIcon :icon="cilFolder" class="nav-icon" /> {{ group.name }}
        </template>
        <li v-for="item in group.items" :key="item.url" class="nav-item">
          <RouterLink :to="item.url" class="nav-link" active-class="active">
            <CIcon :icon="icons[item.url] ?? cilCircle" class="nav-icon" /> {{ item.name }}
          </RouterLink>
        </li>
      </CNavGroup>
    </CSidebarNav>

    <CSidebarFooter class="border-top d-none d-lg-flex">
      <CSidebarToggler @click="ui.sidebarUnfoldable = !ui.sidebarUnfoldable" />
    </CSidebarFooter>
  </CSidebar>
</template>
