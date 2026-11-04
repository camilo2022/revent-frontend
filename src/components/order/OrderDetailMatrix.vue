<script setup>
import { computed } from 'vue'

// Matriz de solo lectura de un detalle de la orden (forma de GET /production_orders/find)
const props = defineProps({ detail: { type: Object, required: true } })

// Columnas: tallas en el orden en que aparecen en las tiendas
const sizes = computed(() => {
  const seen = new Map()
  props.detail.stores.forEach((st) => st.sizes.forEach((s) => seen.has(s.product_detail_id) || seen.set(s.product_detail_id, s.name)))
  return [...seen].map(([id, name]) => ({ id, name }))
})
const qty = (store, sizeId) => store.sizes.find((s) => s.product_detail_id === sizeId)?.quantity ?? 0
const colTotal = (sizeId) => props.detail.stores.reduce((a, st) => a + qty(st, sizeId), 0)
</script>

<template>
  <div class="table-responsive">
    <table class="table table-sm table-bordered matrix-table mb-0">
      <thead>
        <tr>
          <th class="store-col">Tienda</th>
          <th v-for="s in sizes" :key="s.id">{{ s.name }}</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="st in detail.stores" :key="st.store.id">
          <td class="store-col">{{ st.store.code }} · {{ st.store.name }}</td>
          <td v-for="s in sizes" :key="s.id">{{ qty(st, s.id) || '-' }}</td>
          <td class="fw-semibold">{{ st.total }}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="table-light fw-semibold">
          <td class="store-col">Total por talla</td>
          <td v-for="s in sizes" :key="s.id">{{ colTotal(s.id) }}</td>
          <td>{{ detail.total }}</td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>
