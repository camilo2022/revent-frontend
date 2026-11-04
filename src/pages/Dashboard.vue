<script setup>
import { onMounted, reactive, ref } from 'vue'
import { cilBasket, cilDescription, cilIndustry, cilLayers, cilPlus } from '@coreui/icons'
import { useAuthStore } from '@/stores/authStore'
import ProductionOrderService from '@/services/ProductionOrderService'
import TechnicalSheetService from '@/services/TechnicalSheetService'
import ProductService from '@/services/ProductService'
import CollectionService from '@/services/CollectionService'
import StatusBadge from '@/components/UI/templates/StatusBadge.vue'
import { date, listOf } from '@/utils/format'

const auth = useAuthStore()

// Tarjetas con datos reales: se piden listados de 1 registro y se lee meta.pagination.total
const cards = [
  { key: 'orders', title: 'Órdenes pendientes', text: 'Por aprobar o enviar al proveedor', to: '/production_orders?status=Pendiente', icon: cilIndustry, color: 'warning', permission: 'production_orders.all', service: ProductionOrderService, params: { status: 'Pendiente' } },
  { key: 'sheets', title: 'Fichas por aprobar', text: 'Pendientes y en revisión', to: '/technical_sheets', icon: cilDescription, color: 'info', permission: 'technical_sheets.all', service: TechnicalSheetService, params: { status: 'Pendiente' }, extra: { status: 'En revision' } },
  { key: 'products', title: 'Productos', text: 'Referencias con colores y tallas', to: '/products', icon: cilBasket, color: 'primary', permission: 'products.all', service: ProductService },
  { key: 'collections', title: 'Colecciones', text: 'Agrupan los productos por año', to: '/collections', icon: cilLayers, color: 'success', permission: 'collections.all', service: CollectionService },
]
const totals = reactive({})
const loadingTotals = ref(true)

// Accesos rápidos (abren el formulario directamente)
const shortcuts = [
  { title: 'Crear producto', to: '/products?panel=create', permission: 'products.store' },
  { title: 'Crear ficha técnica', to: '/technical_sheets?panel=create', permission: 'technical_sheets.store' },
  { title: 'Nueva orden de producción', to: '/production_orders?panel=create', permission: 'production_orders.store' },
]

const lastOrders = ref([])
const loadingOrders = ref(true)

const total = async (service, params) => {
  const res = await service.all({ per_page: 1, page: 1, ...params })
  return res.data?.meta?.pagination?.total ?? listOf(res, '').length
}

onMounted(async () => {
  await Promise.all(
    cards.filter((c) => auth.can(c.permission)).map(async (c) => {
      try {
        let n = await total(c.service, c.params)
        if (c.extra) n += await total(c.service, c.extra)
        totals[c.key] = n
      } catch {
        totals[c.key] = null
      }
    }),
  )
  loadingTotals.value = false
  if (auth.can('production_orders.all')) {
    try {
      const res = await ProductionOrderService.all({ per_page: 5, page: 1, column: 'id', dir: 'desc' })
      lastOrders.value = listOf(res, 'production_orders')
    } catch {
      lastOrders.value = []
    }
  }
  loadingOrders.value = false
})
</script>

<template>
  <CCard class="mb-4 shadow-sm border-0">
    <CCardBody class="d-flex flex-wrap align-items-center justify-content-between gap-3">
      <div>
        <h4 class="mb-1">Bienvenido{{ auth.userName ? `, ${auth.userName}` : '' }}</h4>
        <p class="text-body-secondary mb-0">Gestiona productos, fichas técnicas y órdenes de producción.</p>
      </div>
      <div class="d-flex flex-wrap gap-2">
        <template v-for="s in shortcuts" :key="s.to">
          <RouterLink v-if="auth.can(s.permission)" :to="s.to" class="btn btn-primary btn-sm"><CIcon :icon="cilPlus" /> {{ s.title }}</RouterLink>
        </template>
      </div>
    </CCardBody>
  </CCard>

  <CRow>
    <template v-for="c in cards" :key="c.key">
      <CCol v-if="auth.can(c.permission)" sm="6" xl="3" class="mb-4">
        <RouterLink :to="c.to" class="text-decoration-none">
          <CCard class="h-100 shadow-sm border-0">
            <CCardBody class="d-flex align-items-center gap-3">
              <div :class="`rounded-3 p-3 bg-${c.color} bg-opacity-10 text-${c.color}`"><CIcon :icon="c.icon" size="xl" /></div>
              <div>
                <div class="fs-3 fw-semibold text-body lh-1">
                  <CSpinner v-if="loadingTotals" size="sm" />
                  <template v-else>{{ totals[c.key] ?? '—' }}</template>
                </div>
                <div class="text-body fw-semibold">{{ c.title }}</div>
                <small class="text-body-secondary">{{ c.text }}</small>
              </div>
            </CCardBody>
          </CCard>
        </RouterLink>
      </CCol>
    </template>
  </CRow>

  <CCard v-if="auth.can('production_orders.all')" class="shadow-sm border-0 mb-4">
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <strong>Últimas órdenes de producción</strong>
      <RouterLink to="/production_orders" class="small">Ver todas</RouterLink>
    </CCardHeader>
    <CCardBody class="p-0">
      <div v-if="loadingOrders" class="p-3 text-body-secondary"><CSpinner size="sm" class="me-2" />Cargando...</div>
      <div v-else-if="!lastOrders.length" class="p-4 text-center text-body-secondary">
        Aún no hay órdenes de producción.
        <RouterLink v-if="auth.can('production_orders.store')" to="/production_orders?panel=create" class="d-block mt-2">Crear la primera orden</RouterLink>
      </div>
      <div v-else class="table-responsive">
        <table class="table table-hover mb-0 align-middle">
          <thead>
            <tr>
              <th>Consecutivo</th>
              <th class="d-none d-md-table-cell">Proveedor</th>
              <th>Producto</th>
              <th>Estado</th>
              <th class="text-end">Pares</th>
              <th class="d-none d-lg-table-cell">Vence</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in lastOrders" :key="o.id">
              <td class="fw-semibold">{{ o.consecutive }}</td>
              <td class="d-none d-md-table-cell">{{ o.supplier?.trade_name || o.supplier?.legal_name || '-' }}</td>
              <td>{{ o.technical_sheet?.product?.code ?? '' }} {{ o.technical_sheet?.product?.name ?? '' }}</td>
              <td><StatusBadge :status="o.status" /></td>
              <td class="text-end">{{ o.total_pairs ?? '-' }}</td>
              <td class="d-none d-lg-table-cell">{{ date(o.due_date) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </CCardBody>
  </CCard>
</template>
