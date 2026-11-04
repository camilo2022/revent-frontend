<script setup>
import { computed, ref } from 'vue'
import { cilCopy, cilPlus, cilTrash, cilChartLine } from '@coreui/icons'
import { cell, colTotal, ensureStore, lineTotal, removeStore, rowTotal } from '@/utils/orderMatrix'
import StorePickerModal from './StorePickerModal.vue'
import CurveModal from './CurveModal.vue'

// Matriz tienda x talla de un color. Edita directamente el objeto `line` (estado de la orden).
const props = defineProps({
  color: { type: Object, required: true }, // color del producto con sus tallas
  line: { type: Object, required: true },
  stores: { type: Array, default: () => [] }, // todas las tiendas
  cellErrors: { type: Object, default: () => ({}) }, // { 'storeId:sizeId': mensaje }
})
const emit = defineEmits(['copy'])

const pickerOpen = ref(false)
const curveOpen = ref(false)

const sizes = computed(() => props.color.sizes)
const storeLabel = (id) => {
  const s = props.stores.find((x) => x.id === id)
  return s ? `${s.code} · ${s.name}` : `Tienda ${id}`
}
const chosenStores = computed(() => props.line.stores.map((id) => ({ id, label: storeLabel(id) })))

const addStores = (ids) => {
  ids.forEach((id) => ensureStore(props.line, id))
  pickerOpen.value = false
}

// Guarda un entero >= 0 por celda
const setCell = (storeId, sizeId, value) => {
  const n = Math.max(0, Math.floor(Number(value)) || 0)
  props.line.qty[storeId][sizeId] = n
}

const applyCurve = ({ storeIds, values }) => {
  storeIds.forEach((st) => sizes.value.forEach((s) => (props.line.qty[st][s.id] = values[s.id])))
  curveOpen.value = false
}
</script>

<template>
  <div>
    <div class="d-flex flex-wrap gap-2 mb-2">
      <CButton color="primary" variant="outline" size="sm" @click="pickerOpen = true"><CIcon :icon="cilPlus" /> Agregar tiendas</CButton>
      <CButton color="primary" variant="outline" size="sm" :disabled="!line.stores.length" @click="curveOpen = true">
        <CIcon :icon="cilChartLine" /> Aplicar curva
      </CButton>
      <CButton color="primary" variant="outline" size="sm" :disabled="!line.stores.length" @click="emit('copy')">
        <CIcon :icon="cilCopy" /> Copiar a otras tiendas/colores
      </CButton>
    </div>

    <p v-if="!line.stores.length" class="text-body-secondary mb-0">Agrega tiendas para ingresar las cantidades por talla.</p>
    <div v-else class="table-responsive">
      <table class="table table-sm table-bordered matrix-table mb-0">
        <thead>
          <tr>
            <th class="store-col">Tienda</th>
            <th v-for="s in sizes" :key="s.id">{{ s.size?.name }}</th>
            <th>Total</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="st in line.stores" :key="st">
            <td class="store-col">{{ storeLabel(st) }}</td>
            <td v-for="s in sizes" :key="s.id">
              <CFormInput
                size="sm"
                type="number"
                min="0"
                :model-value="cell(line, st, s.id) || ''"
                :invalid="!!cellErrors[`${st}:${s.id}`]"
                :title="cellErrors[`${st}:${s.id}`]"
                @update:model-value="setCell(st, s.id, $event)"
              />
            </td>
            <td class="fw-semibold">{{ rowTotal(line, st, sizes) }}</td>
            <td>
              <CButton color="danger" variant="ghost" size="sm" title="Quitar tienda" @click="removeStore(line, st)"><CIcon :icon="cilTrash" /></CButton>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="table-light fw-semibold">
            <td class="store-col">Total por talla</td>
            <td v-for="s in sizes" :key="s.id">{{ colTotal(line, s.id) }}</td>
            <td>{{ lineTotal(line, sizes) }}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <StorePickerModal :visible="pickerOpen" :stores="stores" :selected="line.stores" @close="pickerOpen = false" @confirm="addStores" />
    <CurveModal :visible="curveOpen" :sizes="sizes" :stores="chosenStores" @close="curveOpen = false" @apply="applyCurve" />
  </div>
</template>
