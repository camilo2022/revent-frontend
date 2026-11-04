<script setup>
import { cilApps, cilList, cilPlus } from '@coreui/icons'
import { useAuthStore } from '@/stores/authStore'
import Button from './Button.vue'
import CellValue from './CellValue.vue'
import EmptyState from './EmptyState.vue'
import Pagination from './Pagination.vue'
import RowActions from './RowActions.vue'
import Skeleton from './Skeleton.vue'

// Lista genérica: búsqueda, filtros, orden, modo tabla/tarjetas, esqueleto, vacío y paginación
const props = defineProps({ ctrl: { type: Object, required: true }, config: { type: Object, required: true } })
const auth = useAuthStore()
const canCreate = () => !props.config.readonly && auth.can(`${props.config.permission}.store`)
// Vacío: distinto si es por búsqueda/filtro o porque aún no hay registros
const filtered = () => !!props.ctrl.pagination.search || Object.values(props.ctrl.filters).some((v) => v === true || (v !== '' && v !== false && v != null))
const emptyText = () => (filtered() ? 'No hay resultados con esta búsqueda o filtro.' : `Aún no hay ${props.config.title.toLowerCase()}.`)
// En pantallas pequeñas solo se ven la primera columna (nombre/código), el estado y las acciones
const KEEP = ['name', 'code', 'consecutive', 'username', 'status']
const colClass = (col, i) => {
  if (col.hide) return `d-none d-${col.hide}-table-cell`
  if (i === 0 || col.type === 'status' || KEEP.includes(col.key) || props.config.columns.length <= 3) return ''
  return 'd-none d-md-table-cell'
}
</script>

<template>
  <CCard class="fade-in">
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <strong>{{ config.title }}</strong>
      <slot name="header-actions">
        <Button v-if="canCreate()" size="sm" :icon="cilPlus" @click="ctrl.goCreate()">Nuevo</Button>
      </slot>
    </CCardHeader>
    <CCardBody>
      <!-- Barra de herramientas -->
      <div class="d-flex flex-wrap gap-2 align-items-center mb-3">
        <CFormInput
          v-if="!config.noSearch"
          type="search"
          :model-value="ctrl.pagination.search"
          placeholder="Buscar..."
          aria-label="Buscar"
          style="max-width: 260px"
          @update:model-value="ctrl.onSearch"
        />
        <slot name="filters" />
        <CFormSwitch v-if="config.withTrashed" v-model="ctrl.filters.with_trashed" label="Ver inactivos" @change="ctrl.refresh()" />
        <CFormSwitch v-for="f in config.filters" :key="f.key" v-model="ctrl.filters[f.key]" :label="f.label" @change="ctrl.refresh()" />
        <CButtonGroup class="ms-auto" size="sm" role="group" aria-label="Modo de vista">
          <CButton :color="ctrl.pagination.mode === 'table' ? 'primary' : 'secondary'" variant="outline" title="Tabla" aria-label="Ver como tabla" @click="ctrl.setMode('table')"><CIcon :icon="cilList" /></CButton>
          <CButton :color="ctrl.pagination.mode === 'grid' ? 'primary' : 'secondary'" variant="outline" title="Tarjetas" aria-label="Ver como tarjetas" @click="ctrl.setMode('grid')"><CIcon :icon="cilApps" /></CButton>
        </CButtonGroup>
      </div>

      <Skeleton v-if="ctrl.loading" :variant="ctrl.pagination.mode === 'grid' ? 'cards' : 'table'" />
      <EmptyState v-else-if="!ctrl.items.length" :text="emptyText()">
        <p v-if="!filtered() && canCreate()" class="mb-2 small">Crea {{ config.singular }} para empezar.</p>
        <Button v-if="!filtered() && canCreate()" :icon="cilPlus" @click="ctrl.goCreate()">Crear {{ config.singular }}</Button>
        <Button v-else-if="filtered()" color="secondary" variant="outline" @click="ctrl.onSearch('')">Limpiar búsqueda</Button>
      </EmptyState>

      <!-- Modo tabla: encabezado fijo al desplazar -->
      <div v-else-if="ctrl.pagination.mode === 'table'" class="table-responsive table-sticky-wrap fade-in">
      <CTable hover align="middle" class="table-sticky mb-0">
        <CTableHead>
          <CTableRow>
            <CTableHeaderCell
              v-for="(col, i) in config.columns"
              :key="col.key"
              :class="colClass(col, i)"
              :aria-sort="col.sortable && ctrl.pagination.column === col.key ? (ctrl.pagination.dir === 'asc' ? 'ascending' : 'descending') : undefined"
            >
              <button v-if="col.sortable" type="button" class="btn btn-link p-0 text-reset text-decoration-none fw-semibold" @click="ctrl.sortBy(col.key)">
                {{ col.label }}<span v-if="ctrl.pagination.column === col.key"> {{ ctrl.pagination.dir === 'asc' ? '▲' : '▼' }}</span>
              </button>
              <template v-else>{{ col.label }}</template>
            </CTableHeaderCell>
            <CTableHeaderCell class="text-end">Acciones</CTableHeaderCell>
          </CTableRow>
        </CTableHead>
        <CTableBody>
          <CTableRow v-for="row in ctrl.items" :key="row.id">
            <CTableDataCell v-for="(col, i) in config.columns" :key="col.key" :class="colClass(col, i)">
              <slot :name="`cell-${col.key}`" :row="row"><CellValue :row="row" :col="col" /></slot>
              <CBadge v-if="i === 0 && row.deleted_at" color="secondary" class="ms-1">Inactivo</CBadge>
            </CTableDataCell>
            <CTableDataCell class="text-end text-nowrap"><RowActions :ctrl="ctrl" :config="config" :row="row" /></CTableDataCell>
          </CTableRow>
        </CTableBody>
      </CTable>
      </div>

      <!-- Modo tarjetas -->
      <CRow v-else class="fade-in">
        <CCol v-for="row in ctrl.items" :key="row.id" md="6" xl="4" class="mb-3">
          <CCard class="h-100 border">
            <CCardBody class="d-flex flex-column">
              <h6 class="mb-2">
                <CellValue :row="row" :col="config.columns[0]" />
                <CBadge v-if="row.deleted_at" color="secondary" class="ms-1">Inactivo</CBadge>
              </h6>
              <dl class="small mb-3">
                <div v-for="col in config.columns.slice(1)" :key="col.key" class="d-flex gap-2">
                  <dt class="text-body-secondary fw-normal">{{ col.label }}:</dt>
                  <dd class="mb-0 text-truncate"><CellValue :row="row" :col="col" /></dd>
                </div>
              </dl>
              <div class="mt-auto text-end"><RowActions :ctrl="ctrl" :config="config" :row="row" /></div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <Pagination v-if="!ctrl.loading && ctrl.items.length" :pagination="ctrl.pagination" @page="ctrl.setPage" @per-page="ctrl.onPerPage" />
    </CCardBody>
  </CCard>
</template>
