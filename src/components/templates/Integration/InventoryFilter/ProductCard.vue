<script setup>
import { computed, ref } from 'vue'
import { cilHome } from '@coreui/icons'
import { photoUrl } from '../photoUrl'
import { formatPrice, level, sumSizes, totalOf } from './helpers'

// Una referencia con sus colores y el stock por talla. `place` es la bodega o el lugar al que se refiere el stock.
const props = defineProps({
  product: { type: Object, required: true },
  place: { type: String, default: '' },
  startColor: { type: Number, default: 0 },
  allWarehouses: { type: Boolean, default: true }, // muestra el botón «ver en todas las bodegas»
})
const emit = defineEmits(['gallery', 'warehouses'])

const index = ref(props.startColor)
const color = computed(() => props.product.colores[index.value] ?? null)
const colorTotal = computed(() => sumSizes(color.value))
const image = computed(() => photoUrl(color.value?.imagen || props.product.imagen))
</script>

<template>
  <CCard class="h-100">
    <CCardBody class="d-flex flex-column gap-3">
      <div class="d-flex gap-3">
        <button type="button" class="btn p-0 border rounded-3 overflow-hidden flex-shrink-0 bg-body-tertiary" style="width: 88px; height: 88px" :disabled="!color" :aria-label="`Ver fotos de ${product.referencia}`" @click="emit('gallery', product, index)">
          <img v-if="image" :src="image" :alt="product.nombre || product.referencia" loading="lazy" style="width: 100%; height: 100%; object-fit: contain" />
        </button>
        <div class="flex-grow-1" style="min-width: 0">
          <div class="fw-semibold">{{ product.referencia }}</div>
          <div class="small text-truncate">{{ product.nombre }}</div>
          <div class="small text-body-secondary">{{ product.categoria }}<span v-if="product.genero"> · {{ product.genero }}</span></div>
          <div class="small fw-medium">{{ formatPrice(product.precio) }}</div>
        </div>
        <div class="text-end flex-shrink-0">
          <div class="fs-4 fw-bold" :style="{ color: level(colorTotal).color }">{{ colorTotal }}</div>
          <div v-if="place" class="small text-body-secondary">en {{ place }}</div>
        </div>
      </div>

      <!-- Colores -->
      <div v-if="product.colores.length" class="d-flex flex-wrap gap-1">
        <button v-for="(c, i) in product.colores" :key="c.nombre + i" type="button" :class="['btn btn-sm d-flex align-items-center gap-1', i === index ? 'btn-primary' : 'btn-outline-secondary']" @click="index = i">
          <span class="d-inline-block rounded-circle border" :style="{ width: '12px', height: '12px', background: c.hex || '#9CA3AF', opacity: sumSizes(c) === 0 ? 0.4 : 1 }"></span>
          {{ c.nombre }}
        </button>
      </div>

      <!-- Tallas -->
      <div v-if="color" class="d-flex flex-wrap gap-2">
        <div v-for="(q, size) in color.tallas" :key="size" class="border rounded-2 text-center px-2 py-1" :style="Number(q) > 0 ? { borderColor: level(q).color, background: level(q).color + '14' } : {}" :title="level(q).name">
          <div class="small text-body-secondary">{{ size }}</div>
          <div class="fw-semibold" :style="{ color: Number(q) > 0 ? level(q).color : '#9ca3af' }">{{ q }}</div>
        </div>
      </div>
      <div v-if="color && sumSizes(color) === 0" class="small text-danger">Sin stock en {{ color.nombre?.toLowerCase() }}.</div>

      <div class="d-flex align-items-center justify-content-between border-top pt-2 mt-auto small">
        <span>Total referencia: <strong>{{ totalOf(product) }}</strong> und.</span>
        <span class="d-flex align-items-center gap-2 text-body-secondary">
          {{ product.colores.length }} {{ product.colores.length === 1 ? 'color' : 'colores' }}
          <CButton v-if="allWarehouses" color="secondary" variant="outline" size="sm" title="Ver en todas las bodegas" aria-label="Ver en todas las bodegas" @click="emit('warehouses', product)"><CIcon :icon="cilHome" /></CButton>
        </span>
      </div>
    </CCardBody>
  </CCard>
</template>
