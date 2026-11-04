<script setup>
import { computed, ref } from 'vue'
import { cilCopy, cilPlus, cilTrash, cilChartLine } from '@coreui/icons'
import { applyPastedBlock, cell, colTotal, ensureStore, lineTotal, matrixToText, parsePastedBlock, removeStore, rowTotal } from '@/utils/orderMatrix'
import { useAlertStore } from '@/stores/alertStore'
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

// Pegar un bloque de Excel/Sheets (filas = tiendas, columnas = tallas) desde la celda donde está el cursor
const alerts = useAlertStore()
const onPaste = (storeIndex, sizeIndex, event) => {
  const text = event.clipboardData?.getData('text/plain') ?? ''
  if (!text.includes('\t') && !text.includes('\n')) return // un solo valor: lo maneja el input normal
  event.preventDefault()
  const { rows, ignored } = parsePastedBlock(text)
  const { written, outside } = applyPastedBlock(props.line, sizes.value, storeIndex, sizeIndex, rows)
  const avisos = []
  if (ignored.length) avisos.push(`${ignored.length} celda(s) no eran números enteros y se ignoraron (${ignored.slice(0, 3).join('; ')}${ignored.length > 3 ? '…' : ''})`)
  if (outside) avisos.push(`${outside} valor(es) quedaron fuera de la matriz: agrega más tiendas o revisa el orden de las tallas`)
  if (written) alerts.success(`Se pegaron ${written} cantidad(es) en ${props.color.color?.name ?? 'el color'}.`)
  avisos.forEach((m) => alerts.addAlert({ type: 'warning', message: m, duration: 8000 }))
  if (!written && !avisos.length) alerts.addAlert({ type: 'warning', message: 'No se encontraron cantidades para pegar.' })
}

// Copia la matriz al portapapeles con tabuladores (se pega directo en Excel)
const copying = ref(false)
const copyMatrix = async () => {
  copying.value = true
  try {
    await navigator.clipboard.writeText(matrixToText(props.line, sizes.value, storeLabel))
    alerts.success('Matriz copiada. Pégala en Excel con Ctrl+V.')
  } catch {
    alerts.error('No se pudo copiar al portapapeles. Selecciona las celdas y copia manualmente.')
  } finally {
    copying.value = false
  }
}
</script>

<template>
  <div>
    <label class="form-label">Tiendas<span class="text-danger" aria-label="obligatorio"> *</span></label>
    <div class="d-flex flex-wrap gap-2 mb-2">
      <CButton color="primary" variant="outline" size="sm" @click="pickerOpen = true"><CIcon :icon="cilPlus" /> Agregar tiendas</CButton>
      <CButton color="primary" variant="outline" size="sm" :disabled="!line.stores.length" @click="curveOpen = true">
        <CIcon :icon="cilChartLine" /> Aplicar curva
      </CButton>
      <CButton color="primary" variant="outline" size="sm" :disabled="!line.stores.length" @click="emit('copy')">
        <CIcon :icon="cilCopy" /> Copiar a otras tiendas/colores
      </CButton>
      <CButton color="secondary" variant="outline" size="sm" :disabled="!line.stores.length || copying" title="Copia la tabla para pegarla en Excel" @click="copyMatrix">
        <CSpinner v-if="copying" size="sm" class="me-1" /><CIcon v-else :icon="cilCopy" /> Copiar la matriz
      </CButton>
    </div>

    <p v-if="!line.stores.length" class="text-body-secondary mb-0">Agrega tiendas para ingresar las cantidades por talla.</p>
    <p v-else class="form-text mt-0 mb-2">
      Puedes pegar desde Excel: copia el bloque de cantidades (filas = tiendas en el mismo orden, columnas = tallas), haz clic en la primera celda y presiona Ctrl+V.
    </p>
    <div v-if="line.stores.length" class="table-responsive">
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
          <tr v-for="(st, si) in line.stores" :key="st">
            <td class="store-col">{{ storeLabel(st) }}</td>
            <td v-for="(s, zi) in sizes" :key="s.id">
              <CFormInput
                size="sm"
                type="number"
                min="0"
                :model-value="cell(line, st, s.id) || ''"
                :invalid="!!cellErrors[`${st}:${s.id}`]"
                :title="cellErrors[`${st}:${s.id}`] || 'Puedes pegar aquí un bloque copiado de Excel'"
                @update:model-value="setCell(st, s.id, $event)"
                @paste="onPaste(si, zi, $event)"
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
