<script setup>
import { cilBasket, cilDescription, cilIndustry } from '@coreui/icons'
import { useAuthStore } from '@/stores/authStore'

const auth = useAuthStore()

// Accesos rápidos, visibles según permiso
const shortcuts = [
  { title: 'Productos', text: 'Referencias, colores y tallas', to: '/products', icon: cilBasket, permission: 'products.all' },
  { title: 'Fichas técnicas', text: 'Especificaciones y aprobación', to: '/technical_sheets', icon: cilDescription, permission: 'technical_sheets.all' },
  { title: 'Órdenes de producción', text: 'Pedidos a proveedores por tienda y talla', to: '/production_orders', icon: cilIndustry, permission: 'production_orders.all' },
]
</script>

<template>
  <CCard class="mb-4">
    <CCardBody>
      <h4 class="mb-1">Bienvenido{{ auth.userName ? `, ${auth.userName}` : '' }}</h4>
      <p class="text-body-secondary mb-0">Gestiona productos, fichas técnicas y órdenes de producción.</p>
    </CCardBody>
  </CCard>

  <CRow>
    <template v-for="s in shortcuts" :key="s.to">
      <CCol v-if="auth.can(s.permission)" md="4" class="mb-4">
        <RouterLink :to="s.to" class="text-decoration-none">
          <CCard class="h-100">
            <CCardBody class="d-flex align-items-center gap-3">
              <CIcon :icon="s.icon" size="3xl" class="text-primary" />
              <div>
                <h5 class="mb-0 text-body">{{ s.title }}</h5>
                <small class="text-body-secondary">{{ s.text }}</small>
              </div>
            </CCardBody>
          </CCard>
        </RouterLink>
      </CCol>
    </template>
  </CRow>
</template>
