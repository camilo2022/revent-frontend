<script setup>
import { computed, ref, watch } from 'vue'
import { cilFilter, cilSearch, cilSync } from '@coreui/icons'
import { useAuthStore } from '@/stores/authStore'
import ComboSelect from '@/components/UI/templates/ComboSelect.vue'
import EmptyState from '@/components/UI/templates/EmptyState.vue'
import Pagination from '@/components/UI/templates/Pagination.vue'
import Skeleton from '@/components/UI/templates/Skeleton.vue'
import { cop, normalizeText, providerExpired } from './helpers'

// Proveedores con saldo por pagar: búsqueda, filtro por tipo y paginación en pantalla
const props = defineProps({ providers: { type: Array, default: () => [] }, loading: Boolean, error: String, syncing: Boolean })
const emit = defineEmits(['select', 'sync', 'retry'])
const auth = useAuthStore()

const search = ref('')
const type = ref('')
const page = ref(1)
const perPage = ref(10)
const filtersOpen = ref(false)

const types = computed(() =>
  [...new Set(props.providers.map((p) => String(p.Type ?? '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')).map((t) => ({ value: t, label: t })),
)
const filtered = computed(() => {
  const q = normalizeText(search.value).trim()
  return props.providers.filter((p) => {
    const matches = !q || [p.FullName, p.CompanyName, p.Identification].some((v) => normalizeText(v).includes(q))
    return matches && (!type.value || (p.Type ?? '') === type.value)
  })
})
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage.value)))
const items = computed(() => filtered.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))
const pagination = computed(() => ({
  current_page: page.value,
  total_pages: pages.value,
  total: filtered.value.length,
  count: items.value.length,
  per_page: perPage.value,
  sizes: [10, 25, 50, 100],
}))

watch([search, type, perPage], () => (page.value = 1))
watch(pages, (value) => page.value > value && (page.value = value))
</script>

<template>
  <div>
    <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
      <div class="input-group" style="max-width: 380px">
        <span class="input-group-text"><CIcon :icon="cilSearch" /></span>
        <input v-model="search" type="search" class="form-control" placeholder="Busca por nombre o identificación..." aria-label="Buscar proveedor" autocomplete="off" />
      </div>
      <CButton color="primary" variant="outline" @click="filtersOpen = true">
        <CIcon :icon="cilFilter" class="me-1" />Filtros<CBadge v-if="type" color="primary" class="ms-2">1</CBadge>
      </CButton>
      <CButton
        v-if="auth.can('integration.accounts_payable.providers_sync')"
        color="secondary"
        variant="outline"
        :disabled="syncing || loading"
        title="Vuelve a leer en Siigo el tipo y el nombre comercial de cada proveedor (más lento)"
        @click="emit('sync')"
      >
        <CSpinner v-if="syncing" size="sm" class="me-1" /><CIcon v-else :icon="cilSync" class="me-1" />Sincronizar
      </CButton>
    </div>

    <Skeleton v-if="loading" variant="table" :rows="8" />
    <div v-else-if="error" class="text-center py-4">
      <p class="text-danger">{{ error }}</p>
      <CButton color="primary" variant="outline" size="sm" @click="emit('retry')">Reintentar</CButton>
    </div>
    <EmptyState v-else-if="!items.length" text="Sin resultados." />
    <template v-else>
      <CTable small hover responsive>
        <CTableHead>
          <CTableRow>
            <CTableHeaderCell>Proveedor</CTableHeaderCell>
            <CTableHeaderCell>Identificación</CTableHeaderCell>
            <CTableHeaderCell>Tipo</CTableHeaderCell>
            <CTableHeaderCell class="text-end">Por vencer</CTableHeaderCell>
            <CTableHeaderCell class="text-end">Vencido</CTableHeaderCell>
            <CTableHeaderCell class="text-end">A favor</CTableHeaderCell>
            <CTableHeaderCell class="text-end">Saldo</CTableHeaderCell>
          </CTableRow>
        </CTableHead>
        <CTableBody>
          <CTableRow v-for="p in items" :key="p.AccountID" class="fw-semibold" style="cursor: pointer" tabindex="0" @click="emit('select', p)" @keydown.enter="emit('select', p)">
            <CTableDataCell>
              {{ p.FullName }}
              <div v-if="p.CompanyName" class="small fw-normal text-body-secondary">{{ p.CompanyName }}</div>
            </CTableDataCell>
            <CTableDataCell>{{ p.Identification }}</CTableDataCell>
            <CTableDataCell>{{ p.Type }}</CTableDataCell>
            <CTableDataCell class="text-end text-warning">{{ cop(p.BalanceToExpire) }}</CTableDataCell>
            <CTableDataCell class="text-end text-danger">{{ cop(providerExpired(p)) }}</CTableDataCell>
            <CTableDataCell class="text-end text-success">{{ cop(p.BalanceInFavor) }}</CTableDataCell>
            <CTableDataCell class="text-end">{{ cop(p.TotalBalance) }}</CTableDataCell>
          </CTableRow>
        </CTableBody>
      </CTable>
      <Pagination :pagination="pagination" @page="page = $event" @per-page="perPage = Number($event)" />
    </template>

    <CModal teleport :visible="filtersOpen" alignment="center" @close="filtersOpen = false">
      <CModalHeader><CModalTitle>Filtros de proveedores</CModalTitle></CModalHeader>
      <CModalBody>
        <label class="form-label">Tipo de proveedor</label>
        <ComboSelect v-model="type" :options="types" placeholder="Todos los tipos" />
      </CModalBody>
      <CModalFooter>
        <small class="me-auto text-body-secondary">{{ filtered.length }} resultado(s)</small>
        <CButton color="secondary" variant="outline" @click="type = ''">Limpiar</CButton>
        <CButton color="primary" @click="filtersOpen = false">Ver resultados</CButton>
      </CModalFooter>
    </CModal>
  </div>
</template>
