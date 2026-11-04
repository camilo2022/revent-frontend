<script setup>
import { CIcon } from '@coreui/icons-vue'
import { cilArrowBottom, cilArrowTop } from '@coreui/icons'
import EmptyState from './EmptyState.vue'

// columns: [{ key, label, sortable }]; celdas personalizadas con el slot `cell-<key>`
const props = defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, default: () => [] },
  loading: Boolean,
  pagination: Object,
  search: { type: String, default: '' },
  sortColumn: String,
  sortDir: String,
  searchable: { type: Boolean, default: true },
  emptyText: String,
})
const emit = defineEmits(['update:search', 'page', 'sort'])

// Páginas visibles alrededor de la actual
const pages = () => {
  const total = props.pagination?.total_pages ?? 1
  const current = props.pagination?.current_page ?? 1
  const from = Math.max(1, current - 2)
  const to = Math.min(total, current + 2)
  return Array.from({ length: to - from + 1 }, (_, i) => from + i)
}
</script>

<template>
  <div>
    <div class="d-flex flex-wrap gap-2 align-items-center mb-3">
      <CFormInput
        v-if="searchable"
        :model-value="search"
        placeholder="Buscar..."
        style="max-width: 260px"
        @update:model-value="emit('update:search', $event)"
      />
      <slot name="filters" />
    </div>

    <CTable hover responsive align="middle">
      <CTableHead>
        <CTableRow>
          <CTableHeaderCell
            v-for="col in columns"
            :key="col.key"
            :role="col.sortable ? 'button' : undefined"
            @click="col.sortable && emit('sort', col.key)"
          >
            {{ col.label }}
            <CIcon v-if="col.sortable && sortColumn === col.key" :icon="sortDir === 'asc' ? cilArrowTop : cilArrowBottom" size="sm" />
          </CTableHeaderCell>
          <CTableHeaderCell v-if="$slots.actions" class="text-end">Acciones</CTableHeaderCell>
        </CTableRow>
      </CTableHead>
      <CTableBody>
        <CTableRow v-if="loading">
          <CTableDataCell :colspan="columns.length + 1" class="text-center py-4">
            <CSpinner size="sm" color="primary" /> Cargando...
          </CTableDataCell>
        </CTableRow>
        <CTableRow v-else-if="!rows.length">
          <CTableDataCell :colspan="columns.length + 1"><EmptyState :text="emptyText" /></CTableDataCell>
        </CTableRow>
        <template v-else>
          <CTableRow v-for="row in rows" :key="row.id">
            <CTableDataCell v-for="col in columns" :key="col.key">
              <slot :name="`cell-${col.key}`" :row="row">{{ row[col.key] }}</slot>
            </CTableDataCell>
            <CTableDataCell v-if="$slots.actions" class="text-end text-nowrap">
              <slot name="actions" :row="row" />
            </CTableDataCell>
          </CTableRow>
        </template>
      </CTableBody>
    </CTable>

    <div v-if="pagination && (pagination.total_pages > 1 || pagination.current_page > 1)" class="d-flex justify-content-between align-items-center">
      <small class="text-body-secondary">{{ pagination.total != null ? `${pagination.total} registros` : '' }}</small>
      <CPagination class="mb-0">
        <CPaginationItem :disabled="pagination.current_page <= 1" @click="emit('page', pagination.current_page - 1)">&laquo;</CPaginationItem>
        <CPaginationItem v-for="p in pages()" :key="p" :active="p === pagination.current_page" @click="emit('page', p)">{{ p }}</CPaginationItem>
        <CPaginationItem :disabled="pagination.current_page >= pagination.total_pages" @click="emit('page', pagination.current_page + 1)">&raquo;</CPaginationItem>
      </CPagination>
    </div>
  </div>
</template>
