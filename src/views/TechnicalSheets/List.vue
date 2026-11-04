<script setup>
import { onMounted, reactive, ref } from 'vue'
import { cilPencil, cilPlus, cilSearch } from '@coreui/icons'
import { technicalSheetService } from '@/services/technicalSheet.service'
import { productService } from '@/services/product.service'
import { useCrud } from '@/composables/useCrud'
import { usePermissions } from '@/composables/usePermissions'
import { date } from '@/utils/format'
import DataTable from '@/components/DataTable.vue'
import StatusBadge from '@/components/StatusBadge.vue'

const { can } = usePermissions()
const filters = reactive({ status: '', product_id: '' })
const crud = useCrud(technicalSheetService, 'technical_sheets', { extra: filters })
const products = ref([])

const columns = [
  { key: 'product', label: 'Producto' },
  { key: 'version', label: 'Versión', sortable: true },
  { key: 'status', label: 'Estado', sortable: true },
  { key: 'trademark', label: 'Marca' },
  { key: 'created_at', label: 'Creada', sortable: true },
]
const statuses = [['Pendiente', 'Pendiente'], ['En revision', 'En revisión'], ['Aprobado', 'Aprobado'], ['Cancelado', 'Cancelado']]
const editable = (row) => ['Pendiente', 'En revision'].includes(row.status)

onMounted(async () => {
  crud.load()
  try {
    products.value = (await productService.all()).data.products
  } catch {
    // el filtro por producto queda vacío si falla
  }
})
</script>

<template>
  <CCard>
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <strong>Fichas técnicas</strong>
      <RouterLink v-if="can('technical_sheets.store')" to="/technical_sheets/create">
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
            <option v-for="[value, label] in statuses" :key="value" :value="value">{{ label }}</option>
          </CFormSelect>
          <CFormSelect v-model="filters.product_id" style="max-width: 240px" @change="crud.refresh">
            <option value="">Todos los productos</option>
            <option v-for="p in products" :key="p.id" :value="p.id">{{ p.code }} · {{ p.name }}</option>
          </CFormSelect>
        </template>
        <template #cell-product="{ row }">{{ row.product?.code }} · {{ row.product?.name }}</template>
        <template #cell-version="{ row }">v{{ row.version }}</template>
        <template #cell-status="{ row }"><StatusBadge :status="row.status" /></template>
        <template #cell-trademark="{ row }">{{ row.trademark?.name ?? '-' }}</template>
        <template #cell-created_at="{ row }">{{ date(row.created_at) }}</template>
        <template #actions="{ row }">
          <RouterLink v-if="can('technical_sheets.find')" :to="`/technical_sheets/${row.id}`">
            <CButton color="info" variant="outline" size="sm" class="me-1" title="Ver"><CIcon :icon="cilSearch" /></CButton>
          </RouterLink>
          <RouterLink v-if="can('technical_sheets.update') && editable(row)" :to="`/technical_sheets/${row.id}/edit`">
            <CButton color="primary" variant="outline" size="sm" title="Editar"><CIcon :icon="cilPencil" /></CButton>
          </RouterLink>
        </template>
      </DataTable>
    </CCardBody>
  </CCard>
</template>
