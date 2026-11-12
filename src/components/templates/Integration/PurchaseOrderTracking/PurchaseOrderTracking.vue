<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { cilFilter, cilReload, cilSearch } from '@coreui/icons'
import PurchaseOrderTrackingService from '@/services/integration/PurchaseOrderTrackingService'
import { errorMessage, listOf } from '@/utils/format'
import Button from '@/components/UI/templates/Button.vue'
import DownloadButton from '@/components/UI/templates/DownloadButton.vue'
import EmptyState from '@/components/UI/templates/EmptyState.vue'
import Pagination from '@/components/UI/templates/Pagination.vue'
import Skeleton from '@/components/UI/templates/Skeleton.vue'
import OrderDetail from './OrderDetail.vue'
import OrderFilters from './OrderFilters.vue'
import { activeFilters, AGING, agingOf, dateText, emptyFilters, filterOptions, isAnnulled, matchesFilters, orderStatus, pendingText, qty, receivedColor, summarize, warehouseValue } from './helpers'

// Seguimiento de órdenes de compra: cada orden con lo que se pidió, lo recibido en facturas de compra y lo que falta.
// Muestra los últimos 5 meses de las bodegas de tus tiendas.
const orders = ref(null) // null = cargando
const failed = ref('')
const filters = reactive(emptyFilters())
const showFilters = ref(false)
const open = ref(new Set()) // ids de las órdenes expandidas
const page = ref(1)
const perPage = ref(10)

const load = async () => {
  orders.value = null
  failed.value = ''
  try {
    orders.value = listOf(await PurchaseOrderTrackingService.documents(), 'purchase_orders')
  } catch (error) {
    failed.value = errorMessage(error)
    orders.value = []
  }
}
onMounted(load)

const options = computed(() => filterOptions(orders.value ?? []))
const filtered = computed(() => (orders.value ?? []).filter((order) => matchesFilters(order, filters)))
const summary = computed(() => summarize(filtered.value))
const advanced = computed(() => activeFilters(filters))

watch([filters, perPage], () => (page.value = 1), { deep: true })

const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage.value)))
const visible = computed(() => filtered.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))
const pagination = computed(() => ({
  total: filtered.value.length,
  count: visible.value.length,
  current_page: page.value,
  per_page: perPage.value,
  total_pages: pages.value,
}))

const toggle = (id) => {
  const next = new Set(open.value)
  next.has(id) ? next.delete(id) : next.add(id)
  open.value = next
}
const allOpen = computed(() => visible.value.length > 0 && visible.value.every((o) => open.value.has(o.ACEntryID)))
const toggleAll = () => {
  const next = new Set(open.value)
  visible.value.forEach((o) => (allOpen.value ? next.delete(o.ACEntryID) : next.add(o.ACEntryID)))
  open.value = next
}

const STATUS = {
  completa: { label: 'Completa', color: 'success' },
  pendiente: { label: 'Pendiente', color: 'warning' },
  sin_factura: { label: 'Sin factura', color: 'danger' },
}

const clear = () => Object.assign(filters, emptyFilters())
const apply = (draft) => Object.assign(filters, draft)
</script>

<template>
  <div class="d-flex flex-column gap-4 fade-in">
    <!-- Resumen -->
    <CRow class="g-3">
      <CCol v-for="card in [
        { label: 'Órdenes de compra', value: qty(summary.orders), color: 'primary' },
        { label: 'Cantidad solicitada', value: qty(summary.requested), color: 'secondary' },
        { label: 'Cantidad recibida', value: qty(summary.received), color: 'success' },
        { label: 'Cantidad pendiente', value: pendingText(summary.pending), color: summary.pending < 0 ? 'warning' : 'info' },
      ]" :key="card.label" sm="6" xl="3">
        <CCard :class="`border-top border-top-3 border-top-${card.color}`">
          <CCardBody class="py-3">
            <div class="text-body-secondary small">{{ card.label }}</div>
            <div class="fs-4 fw-semibold">{{ card.value }}</div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>

    <CCard>
      <CCardHeader class="d-flex flex-wrap align-items-center justify-content-between gap-2">
        <strong>Órdenes de compra</strong>
        <div class="d-flex flex-wrap align-items-center gap-2">
          <DownloadButton :request="PurchaseOrderTrackingService.missingDownload" permission="integration.purchase_order_tracking.missing_download" color="success" success-message="Referencias faltantes descargadas.">
            Descargar faltantes
          </DownloadButton>
          <CButton color="secondary" variant="outline" size="sm" :disabled="orders === null" @click="load"><CIcon :icon="cilReload" /> Actualizar</CButton>
        </div>
      </CCardHeader>

      <CCardBody>
        <!-- Barra de búsqueda y filtros -->
        <div class="d-flex flex-wrap gap-2 mb-3">
          <div class="input-group" style="max-width: 480px">
            <span class="input-group-text"><CIcon :icon="cilSearch" /></span>
            <input v-model="filters.search" type="search" class="form-control" placeholder="Busca por orden, proveedor, usuario, referencia..." />
          </div>
          <CButton color="primary" variant="outline" @click="showFilters = true">
            <CIcon :icon="cilFilter" /> Filtros <CBadge v-if="advanced" color="primary" class="ms-1">{{ advanced }}</CBadge>
          </CButton>
          <CButton v-if="advanced || filters.search" color="link" @click="clear">Limpiar</CButton>
          <div class="ms-auto d-flex align-items-center gap-2">
            <CButton color="secondary" variant="outline" size="sm" :disabled="!visible.length" @click="toggleAll">{{ allOpen ? 'Contraer todo' : 'Expandir todo' }}</CButton>
          </div>
        </div>

        <Skeleton v-if="orders === null" variant="table" :rows="8" />

        <CAlert v-else-if="failed" color="danger" class="d-flex flex-wrap align-items-center justify-content-between gap-2">
          <span>No se pudieron cargar las órdenes de compra. {{ failed }}</span>
          <Button color="danger" @click="load">Reintentar</Button>
        </CAlert>

        <EmptyState v-else-if="!filtered.length" text="No se encontraron órdenes de compra." />

        <template v-else>
          <div class="table-responsive">
            <table class="table table-hover align-middle small mb-0">
              <thead>
                <tr>
                  <th style="width: 40px"></th>
                  <th>N° Orden</th>
                  <th>Estado</th>
                  <th>Válida</th>
                  <th>Fecha</th>
                  <th>Usuario</th>
                  <th>Proveedor</th>
                  <th>Fecha límite</th>
                  <th>Bodega</th>
                  <th class="text-end">Solicitada</th>
                  <th class="text-end">Recibida</th>
                  <th>Facturas</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="order in visible" :key="order.ACEntryID">
                  <tr :class="{ 'table-active': open.has(order.ACEntryID) }">
                    <td>
                      <CButton color="link" size="sm" class="p-0" :aria-label="open.has(order.ACEntryID) ? 'Ocultar ítems' : 'Mostrar ítems'" @click="toggle(order.ACEntryID)">
                        {{ open.has(order.ACEntryID) ? '▾' : '▸' }}
                      </CButton>
                    </td>
                    <td class="text-nowrap">
                      <a :href="order.Link" target="_blank" rel="noopener noreferrer" class="fw-semibold">{{ order.DocName }}</a>
                      <CBadge :color="AGING[agingOf(order)].color" class="ms-1" :title="`Antigüedad: ${AGING[agingOf(order)].label}`">{{ AGING[agingOf(order)].label }}</CBadge>
                    </td>
                    <td><CBadge :color="STATUS[orderStatus(order)].color">{{ STATUS[orderStatus(order)].label }}</CBadge></td>
                    <td><CBadge :color="isAnnulled(order) ? 'danger' : 'success'">{{ isAnnulled(order) ? 'Anulada' : 'Válida' }}</CBadge></td>
                    <td class="text-nowrap">{{ dateText(order.DocDate) }}</td>
                    <td>{{ order.User || '-' }}</td>
                    <td>
                      <div class="fw-medium">{{ order.FullName || '-' }}</div>
                      <div class="text-body-secondary">{{ order.CompanyName || '' }} <span v-if="order.Identification">· {{ order.Identification }}</span></div>
                    </td>
                    <td class="text-nowrap">{{ dateText(order.DeadlineDate) }}</td>
                    <td>{{ warehouseValue(order.Warehouse) }}</td>
                    <td class="text-end">{{ qty(order.TotalQuantity) }}</td>
                    <td class="text-end"><span :class="['fw-semibold', receivedColor(order.TotalConfirmed, order.TotalQuantity)]">{{ qty(order.TotalConfirmed) }}</span></td>
                    <td>
                      <div v-for="invoice in order.Invoices ?? []" :key="invoice.ACEntryID" class="text-nowrap">
                        <a :href="invoice.Link" target="_blank" rel="noopener noreferrer">{{ invoice.DocName }}</a>
                        <span class="text-body-secondary"> · {{ dateText(invoice.DocDate) }}</span>
                      </div>
                      <span v-if="!(order.Invoices ?? []).length" class="text-body-secondary">Sin factura asociada</span>
                    </td>
                  </tr>
                  <tr v-if="open.has(order.ACEntryID)">
                    <td colspan="12" class="bg-body-tertiary"><OrderDetail :order="order" :filters="filters" /></td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
          <Pagination :pagination="pagination" class="mt-3" @page="(p) => (page = p)" @per-page="(n) => (perPage = n)" />
        </template>
      </CCardBody>
    </CCard>

    <OrderFilters v-model:visible="showFilters" :filters="filters" :options="options" :count="filtered.length" @apply="apply" @clear="clear" />
  </div>
</template>
