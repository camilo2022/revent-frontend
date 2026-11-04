<script setup>
import { onMounted, reactive } from 'vue'
import { cilPencil, cilPlus, cilSearch } from '@coreui/icons'
import { productService } from '@/services/product.service'
import { useCrud } from '@/composables/useCrud'
import { useOptions } from '@/composables/useOptions'
import { usePermissions } from '@/composables/usePermissions'
import { money } from '@/utils/format'
import DataTable from '@/components/DataTable.vue'
import StatusBadge from '@/components/StatusBadge.vue'

const { can } = usePermissions()
const { options, loadOptions } = useOptions()
const filters = reactive({ collection_id: '' })
const crud = useCrud(productService, 'products', { extra: filters })

const columns = [
  { key: 'code', label: 'Código', sortable: true },
  { key: 'name', label: 'Nombre', sortable: true },
  { key: 'collection', label: 'Colección' },
  { key: 'price', label: 'Precio', sortable: true },
  { key: 'technical_sheet', label: 'Ficha técnica' },
]

onMounted(() => {
  loadOptions(['collections'])
  crud.load()
})
</script>

<template>
  <CCard>
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <strong>Productos</strong>
      <RouterLink v-if="can('products.store')" to="/products/create">
        <CButton color="primary" size="sm"><CIcon :icon="cilPlus" /> Nuevo</CButton>
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
          <CFormSelect v-model="filters.collection_id" style="max-width: 220px" @change="crud.refresh">
            <option value="">Todas las colecciones</option>
            <option v-for="c in options.collections" :key="c.id" :value="c.id">{{ c.name }}</option>
          </CFormSelect>
        </template>
        <template #cell-collection="{ row }">{{ row.collection?.name ?? '-' }}</template>
        <template #cell-price="{ row }">{{ money(row.price) }}</template>
        <template #cell-technical_sheet="{ row }">
          <template v-if="row.technical_sheet">
            <StatusBadge :status="row.technical_sheet.status" /> <small class="text-body-secondary">v{{ row.technical_sheet.version }}</small>
          </template>
          <CBadge v-else color="secondary">Sin ficha</CBadge>
        </template>
        <template #actions="{ row }">
          <RouterLink v-if="can('products.find')" :to="`/products/${row.id}`">
            <CButton color="info" variant="outline" size="sm" class="me-1" title="Ver"><CIcon :icon="cilSearch" /></CButton>
          </RouterLink>
          <RouterLink v-if="can('products.update')" :to="`/products/${row.id}/edit`">
            <CButton color="primary" variant="outline" size="sm" title="Editar"><CIcon :icon="cilPencil" /></CButton>
          </RouterLink>
        </template>
      </DataTable>
    </CCardBody>
  </CCard>
</template>
