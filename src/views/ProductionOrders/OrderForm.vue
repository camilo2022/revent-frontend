<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { productionOrderService } from '@/services/productionOrder.service'
import { technicalSheetService } from '@/services/technicalSheet.service'
import { useOptions } from '@/composables/useOptions'
import { useServerErrors } from '@/composables/useServerErrors'
import { notify } from '@/utils/swal'
import { money } from '@/utils/format'
import { cell, ensureStore, lineTotal, newLine } from '@/utils/orderMatrix'
import FormField from '@/components/FormField.vue'
import LoadingForm from '@/components/LoadingForm.vue'
import ErrorSummary from '@/components/ErrorSummary.vue'
import OrderColorMatrix from '@/components/order/OrderColorMatrix.vue'
import CopyModal from '@/components/order/CopyModal.vue'

// Constructor de la orden: crear (sin id) o editar (con id, solo en Pendiente)
const props = defineProps({ id: [String, Number] })
const router = useRouter()
const { options, loadOptions } = useOptions()
const { errors, message, get, clear, handle } = useServerErrors()

const loading = ref(true)
const saving = ref(false)
const sheets = ref([]) // fichas aprobadas para elegir
const sheet = ref(null) // ficha completa elegida
const lines = reactive({}) // por color: { enabled, cost, price, observation, stores, qty }
const form = reactive({ technical_sheet_id: '', supplier_id: '', due_date: '', vat_percentage: 100, delivery_note_percentage: 0 })

// Errores de la última respuesta 422 llevados a líneas y celdas
const lineErrors = reactive({}) // lineErrors[colorId][campo]
const cellErrors = reactive({}) // cellErrors[colorId]['storeId:sizeId']
let lastMap = [] // posición del payload => color y celdas

const colors = computed(() => sheet.value?.product?.colors ?? [])
const copyColor = ref(null) // color origen del modal de copia

const storeLabel = (id) => {
  const s = options.stores.find((x) => x.id === id)
  return s ? `${s.code} · ${s.name}` : `Tienda ${id}`
}
const enabledColors = computed(() => colors.value.filter((c) => lines[c.id]?.enabled))
const totals = computed(() => {
  const stores = new Set()
  let pairs = 0
  enabledColors.value.forEach((c) => {
    pairs += lineTotal(lines[c.id], c.sizes)
    lines[c.id].stores.forEach((s) => stores.add(s))
  })
  return { pairs, colors: enabledColors.value.length, stores: stores.size }
})

// Prepara una línea vacía por cada color de la ficha
const initLines = () => {
  Object.keys(lines).forEach((k) => delete lines[k])
  colors.value.forEach((c) => (lines[c.id] = newLine(c, sheet.value.product)))
}

const loadSheet = async (sheetId) => {
  sheet.value = null
  if (!sheetId) return
  try {
    sheet.value = (await technicalSheetService.find(sheetId)).data.technical_sheet
    initLines()
  } catch (error) {
    handle(error)
  }
}

// Carga una orden existente en el constructor
const loadOrder = async () => {
  const order = (await productionOrderService.find(props.id)).data.production_order
  if (order.status !== 'Pendiente') {
    router.replace(`/production_orders/${order.id}`)
    return false
  }
  Object.assign(form, {
    technical_sheet_id: order.technical_sheet.id,
    supplier_id: order.supplier.id,
    due_date: order.due_date,
    vat_percentage: order.vat_percentage,
    delivery_note_percentage: order.delivery_note_percentage,
  })
  await loadSheet(order.technical_sheet.id)
  order.details.forEach((d) => {
    const line = lines[d.product_detail_id]
    if (!line) return
    Object.assign(line, { enabled: true, cost: d.cost, price: d.price, observation: d.observation ?? '' })
    d.stores.forEach((st) => {
      ensureStore(line, st.store.id)
      st.sizes.forEach((sz) => (line.qty[st.store.id][sz.product_detail_id] = sz.quantity))
    })
  })
  return true
}

onMounted(async () => {
  await loadOptions(['suppliers', 'stores'])
  try {
    if (props.id) {
      if (!(await loadOrder())) return
    } else {
      sheets.value = (await technicalSheetService.all({ only_approved: 1 })).data.technical_sheets
    }
  } catch (error) {
    handle(error)
  }
  loading.value = false
})

// Construye el cuerpo exacto del contrato y recuerda la posición de cada celda
const buildPayload = () => {
  lastMap = []
  const details = enabledColors.value.map((c) => {
    const line = lines[c.id]
    const quantities = []
    const cells = []
    line.stores.forEach((st) =>
      c.sizes.forEach((sz) => {
        const quantity = cell(line, st, sz.id)
        if (quantity > 0) {
          quantities.push({ store_id: st, product_detail_id: sz.id, quantity })
          cells.push(`${st}:${sz.id}`)
        }
      }),
    )
    lastMap.push({ colorId: c.id, cells })
    return {
      product_detail_id: c.id,
      cost: Number(line.cost),
      price: Number(line.price),
      observation: line.observation || null,
      production_order_detail_quantities: quantities,
    }
  })
  return {
    technical_sheet_id: Number(form.technical_sheet_id),
    supplier_id: Number(form.supplier_id),
    due_date: form.due_date,
    vat_percentage: Number(form.vat_percentage),
    delivery_note_percentage: Number(form.delivery_note_percentage),
    production_order_details: details,
  }
}

// Lleva claves como `production_order_details.0.production_order_detail_quantities.2.quantity` a su celda
const mapErrors = () => {
  Object.keys(lineErrors).forEach((k) => delete lineErrors[k])
  Object.keys(cellErrors).forEach((k) => delete cellErrors[k])
  Object.entries(errors.value).forEach(([key, msgs]) => {
    const q = key.match(/^production_order_details\.(\d+)\.production_order_detail_quantities\.(\d+)\.(\w+)$/)
    const d = key.match(/^production_order_details\.(\d+)\.(\w+)$/)
    if (q && lastMap[q[1]]) {
      const { colorId, cells } = lastMap[q[1]]
      ;(cellErrors[colorId] ??= {})[cells[q[2]]] = msgs[0]
    } else if (d && lastMap[d[1]]) {
      ;(lineErrors[lastMap[d[1]].colorId] ??= {})[d[2]] = msgs[0]
    }
  })
}

const save = async () => {
  saving.value = true
  clear()
  try {
    const body = buildPayload()
    const res = props.id ? await productionOrderService.update(props.id, body) : await productionOrderService.store(body)
    notify('Orden guardada')
    router.push(`/production_orders/${res.data.production_order?.id ?? props.id}`)
  } catch (error) {
    handle(error)
    mapErrors()
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <LoadingForm v-if="loading" />
  <form v-else @submit.prevent="save">
    <ErrorSummary :message="message" :errors="errors" />

    <CCard class="mb-4">
      <CCardHeader><strong>{{ id ? 'Editar orden de producción' : 'Nueva orden de producción' }}</strong></CCardHeader>
      <CCardBody>
        <CRow>
          <CCol md="6">
            <FormField label="Ficha técnica aprobada" required :error="get('technical_sheet_id')">
              <CFormInput
                v-if="id"
                :model-value="`${sheet?.product?.code} · ${sheet?.product?.name} (v${sheet?.version})`"
                disabled
              />
              <CFormSelect
                v-else
                v-model="form.technical_sheet_id"
                :invalid="!!get('technical_sheet_id')"
                @change="loadSheet(form.technical_sheet_id)"
              >
                <option value="">Selecciona una ficha...</option>
                <option v-for="s in sheets" :key="s.id" :value="s.id">{{ s.product?.code }} · {{ s.product?.name }} (v{{ s.version }})</option>
              </CFormSelect>
            </FormField>
          </CCol>
          <CCol md="6">
            <FormField label="Proveedor" required :error="get('supplier_id')">
              <CFormSelect v-model="form.supplier_id" :invalid="!!get('supplier_id')">
                <option value="">Selecciona...</option>
                <option v-for="s in options.suppliers" :key="s.id" :value="s.id">{{ s.trade_name || s.legal_name }}</option>
              </CFormSelect>
            </FormField>
          </CCol>
        </CRow>
        <CRow>
          <CCol md="4">
            <FormField label="Fecha de vencimiento" required :error="get('due_date')">
              <CFormInput v-model="form.due_date" type="date" :invalid="!!get('due_date')" />
            </FormField>
          </CCol>
          <CCol md="4">
            <FormField label="% IVA" :error="get('vat_percentage')">
              <CFormInput v-model="form.vat_percentage" type="number" min="0" :invalid="!!get('vat_percentage')" />
            </FormField>
          </CCol>
          <CCol md="4">
            <FormField label="% Remisión" :error="get('delivery_note_percentage')">
              <CFormInput v-model="form.delivery_note_percentage" type="number" min="0" :invalid="!!get('delivery_note_percentage')" />
            </FormField>
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>

    <template v-if="sheet">
      <CCard v-for="c in colors" :key="c.id" class="mb-3">
        <CCardHeader class="d-flex justify-content-between align-items-center">
          <strong>{{ c.color?.name }} <small class="text-body-secondary">{{ c.code }}</small></strong>
          <CFormSwitch
            :id="`use-${c.id}`"
            label="Incluir en la orden"
            :model-value="lines[c.id].enabled"
            @update:model-value="lines[c.id].enabled = $event"
          />
        </CCardHeader>
        <CCardBody v-if="lines[c.id].enabled">
          <CRow>
            <CCol md="3">
              <FormField label="Costo" :error="lineErrors[c.id]?.cost">
                <CFormInput v-model="lines[c.id].cost" type="number" min="0" :invalid="!!lineErrors[c.id]?.cost" />
              </FormField>
            </CCol>
            <CCol md="3">
              <FormField label="Precio" :error="lineErrors[c.id]?.price">
                <CFormInput v-model="lines[c.id].price" type="number" min="0" :invalid="!!lineErrors[c.id]?.price" />
              </FormField>
            </CCol>
            <CCol md="6">
              <FormField label="Observación" :error="lineErrors[c.id]?.observation">
                <CFormInput v-model="lines[c.id].observation" :invalid="!!lineErrors[c.id]?.observation" />
              </FormField>
            </CCol>
          </CRow>
          <OrderColorMatrix
            :color="c"
            :line="lines[c.id]"
            :stores="options.stores"
            :cell-errors="cellErrors[c.id] ?? {}"
            @copy="copyColor = c.id"
          />
        </CCardBody>
      </CCard>

      <CCard class="mb-4">
        <CCardHeader><strong>Resumen</strong></CCardHeader>
        <CCardBody class="d-flex flex-wrap gap-5">
          <div><small class="text-body-secondary d-block">Total de pares</small><span class="fs-4 fw-semibold">{{ totals.pairs }}</span></div>
          <div><small class="text-body-secondary d-block">Colores</small><span class="fs-4 fw-semibold">{{ totals.colors }}</span></div>
          <div><small class="text-body-secondary d-block">Tiendas</small><span class="fs-4 fw-semibold">{{ totals.stores }}</span></div>
          <div v-if="totals.pairs">
            <small class="text-body-secondary d-block">Costo estimado</small>
            <span class="fs-4 fw-semibold">{{ money(enabledColors.reduce((a, c) => a + lineTotal(lines[c.id], c.sizes) * Number(lines[c.id].cost || 0), 0)) }}</span>
          </div>
        </CCardBody>
      </CCard>
    </template>
    <p v-else class="text-body-secondary">Elige una ficha técnica aprobada para armar la orden.</p>

    <div class="d-flex justify-content-end gap-2">
      <RouterLink to="/production_orders"><CButton color="secondary" variant="outline">Cancelar</CButton></RouterLink>
      <CButton type="submit" color="primary" :disabled="saving || !sheet || !totals.pairs"><CSpinner v-if="saving" size="sm" /> Guardar orden</CButton>
    </div>

    <CopyModal
      :visible="copyColor !== null"
      :source-id="copyColor"
      :colors="colors"
      :lines="lines"
      :store-label="storeLabel"
      @close="copyColor = null"
      @done="copyColor = null"
    />
  </form>
</template>
