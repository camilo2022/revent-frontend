<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { cilFilter, cilSearch } from '@coreui/icons'
import InventoryFilterService from '@/services/integration/InventoryFilterService'
import { errorMessage } from '@/utils/format'
import EmptyState from '@/components/UI/templates/EmptyState.vue'
import Skeleton from '@/components/UI/templates/Skeleton.vue'
import AllWarehousesModal from './AllWarehousesModal.vue'
import InventoryFiltersModal from './InventoryFiltersModal.vue'
import PhotoGallery from './PhotoGallery.vue'
import ProductCard from './ProductCard.vue'
import { activeFilters, categoriesOf, emptyFilters, filterProducts, macrosOf, norm, normalizeProduct, sizesOf } from './helpers'

// Inventario disponible por tienda: se elige la bodega y se ve cada referencia con su stock por color y talla.
// Cada consulta va a Siigo; solo aparecen las bodegas de las tiendas que tienes asignadas.
const warehouses = ref([])
const groups = ref([])
const store = ref(null) // bodega elegida
const loadingCatalogs = ref(true)
const catalogError = ref('')

const products = ref([])
const loading = ref(false)
const error = ref('')

const filters = reactive(emptyFilters())
const storeQuery = ref('')
const showFilters = ref(false)
const gallery = reactive({ open: false, referencia: '', nombre: '', color: '' })
const all = reactive({ open: false, referencia: '', nombre: '' })

onMounted(async () => {
  try {
    const res = await InventoryFilterService.catalogs()
    warehouses.value = res.data.catalogs.warehouses
    groups.value = res.data.catalogs.color_groups
    // Con una sola bodega no hay nada que elegir
    if (warehouses.value.length === 1) await choose(warehouses.value[0])
  } catch (e) {
    catalogError.value = errorMessage(e)
  } finally {
    loadingCatalogs.value = false
  }
})

const storeResults = computed(() => {
  const q = norm(storeQuery.value).trim()
  return q ? warehouses.value.filter((w) => norm(w.name).includes(q)) : warehouses.value
})

const load = async () => {
  loading.value = true
  error.value = ''
  products.value = []
  try {
    const res = await InventoryFilterService.search(store.value.id)
    products.value = (res.data.inventory.productos ?? []).map(normalizeProduct)
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}

const choose = async (warehouse) => {
  store.value = warehouse
  Object.assign(filters, emptyFilters())
  await load()
}
const changeStore = () => {
  store.value = null
  products.value = []
  error.value = ''
}

const results = computed(() => filterProducts(products.value, filters))
const advanced = computed(() => activeFilters(filters))
const categories = computed(() => categoriesOf(products.value))
const sizes = computed(() => sizesOf(products.value))
const macros = computed(() => macrosOf(groups.value))

const suggestions = computed(() => {
  const q = norm(filters.query).trim()
  if (!q) return []
  return products.value.filter((p) => norm(p.referencia).startsWith(q) || norm(p.nombre).includes(q)).slice(0, 6)
})

const openGallery = (product, colorIndex) => Object.assign(gallery, { open: true, referencia: product.referencia, nombre: product.nombre, color: product.colores[colorIndex]?.nombre ?? '' })
const openAll = (product) => Object.assign(all, { open: true, referencia: product.referencia, nombre: product.nombre })

const clear = () => Object.assign(filters, emptyFilters())
const apply = (draft) => Object.assign(filters, draft)
</script>

<template>
  <div class="d-flex flex-column gap-4 fade-in">
    <Skeleton v-if="loadingCatalogs" variant="cards" :rows="3" />

    <CAlert v-else-if="catalogError" color="danger">{{ catalogError }}</CAlert>

    <!-- Paso 1: elegir la tienda -->
    <CCard v-else-if="!store">
      <CCardBody class="p-4 text-center">
        <h5 class="mb-1">¿En qué tienda estás?</h5>
        <p class="text-body-secondary">Escribe para buscar tu punto de venta y selecciónalo.</p>
        <EmptyState v-if="!warehouses.length" text="No tienes bodegas asignadas. Pide que te asignen una tienda." />
        <template v-else>
          <div class="input-group mx-auto mb-3" style="max-width: 420px">
            <span class="input-group-text"><CIcon :icon="cilSearch" /></span>
            <input v-model="storeQuery" type="search" class="form-control" placeholder="Busca tu tienda..." />
          </div>
          <div v-if="storeResults.length" class="d-flex flex-wrap justify-content-center gap-2">
            <CButton v-for="w in storeResults" :key="w.id" color="primary" variant="outline" @click="choose(w)">{{ w.name }}</CButton>
          </div>
          <p v-else class="text-body-secondary mb-0">No encontramos una tienda con ese nombre.</p>
        </template>
      </CCardBody>
    </CCard>

    <!-- Paso 2: inventario -->
    <template v-else>
      <CCard>
        <CCardBody>
          <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
            <div>
              <div class="fs-5 fw-semibold">Inventario disponible</div>
              <div class="text-body-secondary small">Disponibilidad por color y talla de cada referencia</div>
            </div>
            <CButton color="primary" variant="outline" size="sm" @click="changeStore">{{ store.name }} · cambiar</CButton>
          </div>

          <div v-if="!loading" class="d-flex flex-wrap gap-2">
            <div class="position-relative flex-grow-1" style="max-width: 560px">
              <div class="input-group">
                <span class="input-group-text"><CIcon :icon="cilSearch" /></span>
                <input v-model="filters.query" type="search" class="form-control" placeholder="Busca por referencia, nombre o color..." />
              </div>
              <div v-if="suggestions.length && suggestions.length < products.length && results.length !== 1" class="list-group position-absolute w-100 shadow-sm" style="z-index: 5">
                <button v-for="p in suggestions" :key="p.referencia" type="button" class="list-group-item list-group-item-action small" @click="filters.query = p.referencia">
                  <strong>{{ p.referencia }}</strong> · {{ p.nombre }}
                </button>
              </div>
            </div>
            <CButton color="primary" variant="outline" @click="showFilters = true"><CIcon :icon="cilFilter" /> Filtros <CBadge v-if="advanced" color="primary" class="ms-1">{{ advanced }}</CBadge></CButton>
            <CButton v-if="advanced || filters.query" color="link" @click="clear">Limpiar</CButton>
          </div>
        </CCardBody>
      </CCard>

      <template v-if="loading">
        <p class="text-body-secondary mb-0">Cargando inventario de {{ store.name }}...</p>
        <Skeleton variant="cards" :rows="6" />
      </template>

      <CAlert v-else-if="error" color="danger" class="d-flex flex-wrap align-items-center justify-content-between gap-2">
        <span>{{ error }}</span>
        <CButton color="danger" size="sm" @click="load">Reintentar</CButton>
      </CAlert>

      <template v-else>
        <div class="text-body-secondary">
          <strong>{{ results.length }}</strong> {{ results.length === 1 ? 'referencia encontrada' : 'referencias encontradas' }} en {{ store.name }}
        </div>
        <EmptyState v-if="!results.length" :text="`No encontramos nada con esa búsqueda en ${store.name}.`" />
        <CRow v-else class="g-3">
          <CCol v-for="p in results" :key="p.id ?? p.referencia" md="6" xl="4">
            <ProductCard :product="p" :place="store.name" @gallery="openGallery" @warehouses="openAll" />
          </CCol>
        </CRow>
      </template>
    </template>

    <InventoryFiltersModal v-model:visible="showFilters" :filters="filters" :categories="categories" :sizes="sizes" :macros="macros" :groups="groups" :count="results.length" @apply="apply" @clear="clear" />
    <PhotoGallery v-model:visible="gallery.open" :referencia="gallery.referencia" :nombre="gallery.nombre" :color="gallery.color" />
    <AllWarehousesModal v-model:visible="all.open" :referencia="all.referencia" :nombre="all.nombre" @gallery="openGallery" />
  </div>
</template>
