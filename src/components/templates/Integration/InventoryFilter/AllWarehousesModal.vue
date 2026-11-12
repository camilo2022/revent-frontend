<script setup>
import { computed, ref, watch } from 'vue'
import InventoryFilterService from '@/services/integration/InventoryFilterService'
import { errorMessage } from '@/utils/format'
import ComboSelect from '@/components/UI/templates/ComboSelect.vue'
import Skeleton from '@/components/UI/templates/Skeleton.vue'
import ProductCard from './ProductCard.vue'
import { norm, normalizeProduct, totalOf, warehouseTotals } from './helpers'

// Stock de una referencia en todas las bodegas a las que tienes acceso. Consulta Siigo bodega por bodega: puede tardar unos segundos.
const visible = defineModel('visible', { default: false })
const props = defineProps({ referencia: String, nombre: String })
const emit = defineEmits(['gallery'])

const loading = ref(false)
const error = ref('')
const products = ref([])
const failed = ref([]) // bodegas que no respondieron
const search = ref('')
const warehouse = ref('')

const load = async () => {
  loading.value = true
  error.value = ''
  products.value = []
  failed.value = []
  search.value = ''
  warehouse.value = ''
  const reference = props.referencia
  try {
    const res = await InventoryFilterService.allWarehouses(reference)
    // Si se cerró o se abrió otra referencia mientras tanto, se descarta
    if (!visible.value || props.referencia !== reference) return
    products.value = (res.data.inventory.productos ?? []).map(normalizeProduct)
    failed.value = res.data.inventory.errores ?? []
  } catch (e) {
    if (props.referencia === reference) error.value = errorMessage(e)
  } finally {
    if (props.referencia === reference) loading.value = false
  }
}
watch(visible, (open) => open && props.referencia && load(), { immediate: true })

const totals = computed(() => warehouseTotals(products.value))
const options = computed(() => [{ value: '', label: 'Todas las bodegas' }, ...totals.value.map((w) => ({ value: String(w.id), label: `${w.nombre} (${w.total} und.)` }))])
const shown = computed(() =>
  products.value.filter((p) => (!warehouse.value || String(p.bodega_id) === warehouse.value) && (!search.value.trim() || norm(p.bodega).includes(norm(search.value.trim())))),
)
const grand = computed(() => products.value.reduce((sum, p) => sum + totalOf(p), 0))
</script>

<template>
  <CModal teleport :visible="visible" size="xl" alignment="center" scrollable @close="visible = false">
    <CModalHeader>
      <CModalTitle>
        {{ referencia }} · {{ nombre }}
        <div v-if="!loading && !error" class="fs-6 fw-normal text-body-secondary">{{ products.length }} {{ products.length === 1 ? 'bodega con stock' : 'bodegas con stock' }} · {{ grand }} und. en total</div>
      </CModalTitle>
    </CModalHeader>
    <CModalBody>
      <template v-if="loading">
        <p class="text-body-secondary">Consultando todas las bodegas, esto puede tardar unos segundos...</p>
        <Skeleton variant="cards" :rows="3" />
      </template>
      <CAlert v-else-if="error" color="danger" class="d-flex flex-wrap align-items-center justify-content-between gap-2">
        <span>{{ error }}</span>
        <CButton color="danger" size="sm" @click="load">Reintentar</CButton>
      </CAlert>
      <template v-else>
        <CAlert v-if="failed.length" color="warning">No se pudo consultar: {{ failed.join(', ') }}. Los datos pueden estar incompletos.</CAlert>
        <div v-if="!products.length" class="text-center text-body-secondary py-4">Esta referencia no tiene stock en las bodegas a las que tienes acceso.</div>
        <template v-else>
          <div v-if="products.length > 1" class="d-flex flex-wrap gap-2 mb-3">
            <input v-model="search" type="search" class="form-control" style="max-width: 280px" placeholder="Buscar bodega por nombre..." />
            <div style="min-width: 260px"><ComboSelect v-model="warehouse" :options="options" /></div>
            <span class="align-self-center small text-body-secondary">{{ shown.length }} de {{ products.length }} bodegas</span>
          </div>
          <CRow class="g-3">
            <CCol v-for="p in shown" :key="p.id" md="6" xl="4">
              <ProductCard :product="p" :place="p.bodega" :all-warehouses="false" @gallery="(prod, i) => emit('gallery', prod, i)" />
            </CCol>
          </CRow>
        </template>
      </template>
    </CModalBody>
  </CModal>
</template>
