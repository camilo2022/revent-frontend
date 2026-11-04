<script setup>
import { onMounted, reactive } from 'vue'
import { cilPencil, cilPlus, cilSearch } from '@coreui/icons'
import { productionOrderService } from '@/services/productionOrder.service'
import { useCrud } from '@/composables/useCrud'
import { useOptions } from '@/composables/useOptions'
import { usePermissions } from '@/composables/usePermissions'
import { date } from '@/utils/format'
import DataTable from '@/components/DataTable.vue'
import StatusBadge from '@/components/StatusBadge.vue'

const { can } = usePermissions()
const { options, loadOptions } = useOptions()
const filters = reactive({ status: '', supplier_id: '' })
const crud = useCrud(productionOrderService, 'production_orders', { extra: filters })

const columns = [
  { key: 'consecutive', label: 'Consecutivo', sortable: true },
  { key: 'supplier', label: 'Proveedor' },
  { key: 'product', label: 'Producto' },
  { key: 'status', label: 'Estado', sortable: true },
  { key: 'total_pairs', label: 'Pares' },
  { key: 'stores_count', label: 'Tiendas' },
  { key: 'colors_count', label: 'Colores' },
  { key: 'due_date', label: 'Vence', sortable: true },
]

onMounted(() => {
  loadOptions(['suppliers'])
  crud.load()
})
</script>

<template>
  <CCard>
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <strong>Órdenes de producción</strong>
      <RouterLink v-if="can('production_orders.store')" to="/production_orders/create">
        <CButton color="primary" size="sm"><CIcon :icon="cilPlus" /> Nueva</CButton>
      </RouterLink>
    </CCardHeader>
    <CCardBody>
      <DataTable
        :columns="columns"
        :rows="crud.items.value"
        :loading="crud.loading.value"
        :pagination="crud.pagination.value"
        :search="crud.query.search"
        :sort-column="crud.query.column"
        :sort-dir="crud.query.dir"
        @update:search="crud.setSearch"
        @page="crud.setPage"
        @sort="crud.sortBy"
      >
        <template #filters>
          <CFormSelect v-model="filters.status" style="max-width: 180px" @change="crud.refresh">
            <option value="">Todos los estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Aprobado">Aprobado</option>
            <option value="Cancelado">Cancelado</option>
          </CFormSelect>
          <CFormSelect v-model="filters.supplier_id" style="max-width: 240px" @change="crud.refresh">
            <option value="">Todos los proveedores</option>
            <option v-for="s in options.suppliers" :key="s.id" :value="s.id">{{ s.trade_name || s.legal_name }}</option>
          </CFormSelect>
        </template>
        <template #cell-supplier="{ row }">{{ row.supplier?.trade_name || row.supplier?.legal_name || '-' }}</template>
        <template #cell-product="{ row }">{{ row.technical_sheet?.product?.code }} · {{ row.technical_sheet?.product?.name }}</template>
        <template #cell-status="{ row }"><StatusBadge :status="row.status" /></template>
        <template #cell-due_date="{ row }">{{ date(row.due_date) }}</template>
        <template #actions="{ row }">
          <RouterLink v-if="can('production_orders.find')" :to="`/production_orders/${row.id}`">
            <CButton color="info" variant="outline" size="sm" class="me-1" title="Ver"><CIcon :icon="cilSearch" /></CButton>
          </RouterLink>
          <RouterLink v-if="can('production_orders.update') && row.status === 'Pendiente'" :to="`/production_orders/${row.id}/edit`">
            <CButton color="primary" variant="outline" size="sm" title="Editar"><CIcon :icon="cilPencil" /></CButton>
          </RouterLink>
        </template>
      </DataTable>
    </CCardBody>
  </CCard>
</template>
