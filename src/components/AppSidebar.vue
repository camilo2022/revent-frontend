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
const fallback = [
  { name: 'Producción', items: [
    { name: 'Productos', url: '/products', permission: 'products.all' },
    { name: 'Fichas técnicas', url: '/technical_sheets', permission: 'technical_sheets.all' },
    { name: 'Órdenes de producción', url: '/production_orders', permission: 'production_orders.all' },
  ] },
  { name: 'Catálogos', items: [
    { name: 'Colores', url: '/colors', permission: 'colors.all' },
    { name: 'Tallas', url: '/sizes', permission: 'sizes.all' },
    { name: 'Marcas', url: '/trademarks', permission: 'trademarks.all' },
    { name: 'Colecciones', url: '/collections', permission: 'collections.all' },
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
