<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { cilArrowLeft, cilFilter, cilMoney, cilSearch } from '@coreui/icons'
import AccountPayableService from '@/services/integration/AccountPayableService'
import { useAlertStore } from '@/stores/alertStore'
import { useAuthStore } from '@/stores/authStore'
import { errorMessage } from '@/utils/format'
import ComboSelect from '@/components/UI/templates/ComboSelect.vue'
import EmptyState from '@/components/UI/templates/EmptyState.vue'
import Skeleton from '@/components/UI/templates/Skeleton.vue'
import AdvanceModal from './AdvanceModal.vue'
import ConciliationModal from './ConciliationModal.vue'
import PaymentDetailModal from './PaymentDetailModal.vue'
import PaymentModal from './PaymentModal.vue'
import PaymentsByMonth from './PaymentsByMonth.vue'
import {
  CLASSIFICATIONS, classKeys, computeMeta, conciliationPlan, cop, datePart, day, errorTitle, estado, hasError, isReceipt, isSelectable,
  normalizeText, providerExpired, quantity, rowClass, searchText, summarize,
} from './helpers'

// Detalle de un proveedor: resumen, documentos por pagar (con filtros y selección) y pagos por mes.
// Desde aquí se crean el recibo de pago, el anticipo y el cruce contable (cada uno con su permiso).
const props = defineProps({ provider: { type: Object, required: true }, settings: { type: Object, required: true } })
const emit = defineEmits(['back', 'changed'])
const auth = useAuthStore()
const alerts = useAlertStore()

const canPay = computed(() => auth.can('integration.accounts_payable.payment_store'))
const canAdvance = computed(() => auth.can('integration.accounts_payable.advance_store'))
const canConciliate = computed(() => auth.can('integration.accounts_payable.conciliation_store'))
const canDocuments = computed(() => auth.can('integration.accounts_payable.documents'))
const canPayments = computed(() => auth.can('integration.accounts_payable.payments'))
const canHtml = computed(() => auth.can('integration.accounts_payable.payment_html'))

const tab = ref('documents')
const allData = ref(false)
const docs = ref([])
const loading = ref(false)
const failed = ref('')
const summary = ref({ ...props.provider })
const payments = ref(null) // null = aún no se consulta
const loadingPayments = ref(false)
const paymentsFailed = ref('')
let docsToken = 0
let paymentsToken = 0

const selected = ref(new Set()) // índices de docs elegidos (se conservan al filtrar)
const filters = reactive({ search: '', type: '', color: '', dateField: 'DueDate', from: '', to: '' })
const filtersOpen = ref(false)

const meta = computed(() => computeMeta(docs.value))
const index = computed(() => docs.value.map((doc, i) => searchText(doc, meta.value[i], allData.value)))
const selectable = (i) => isSelectable(docs.value[i]) && !hasError(meta.value[i])

const visible = computed(() => {
  const tokens = normalizeText(filters.search).split(/\s+/).filter(Boolean)
  return docs.value
    .map((doc, i) => i)
    .filter((i) => {
      const doc = docs.value[i]
      if (tokens.length && !tokens.every((t) => index.value[i].includes(t))) return false
      if (filters.type && String(doc.DuePrefix ?? '').trim() !== filters.type) return false
      if (filters.color) {
        const keys = classKeys(doc, meta.value[i])
        if (filters.color === '__none__' ? keys.length : !keys.includes(filters.color)) return false
      }
      if (filters.from || filters.to) {
        const value = datePart(doc[filters.dateField])
        if (!value || (filters.from && value < filters.from) || (filters.to && value > filters.to)) return false
      }
      return true
    })
})
const activeFilters = computed(() => [filters.type, filters.color, filters.from || filters.to].filter(Boolean).length)
const typeOptions = computed(() =>
  [...new Set(docs.value.map((d) => String(d.DuePrefix ?? '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')).map((t) => ({ value: t, label: t })),
)
const colorOptions = [
  { value: '__none__', label: '⚪ Sin clasificar' },
  ...CLASSIFICATIONS.map((c) => ({ value: c.key, label: `${c.key} · ${c.label}` })),
]
const dateFieldOptions = [
  { value: 'DueDate', label: 'Fecha de vencimiento' },
  { value: 'CreatedDate', label: 'Fecha de creación' },
]
const clearFilters = () => Object.assign(filters, { search: '', type: '', color: '', dateField: 'DueDate', from: '', to: '' })

// Selección: los totales cuentan todo lo elegido, esté visible u oculto por el filtro
const selectedDocs = computed(() => [...selected.value].sort((a, b) => a - b).map((i) => docs.value[i]).filter(Boolean))
const selectedTotal = computed(() => selectedDocs.value.reduce((sum, d) => sum + (Number(d.Saldo) || 0), 0))
const hiddenSelected = computed(() => [...selected.value].filter((i) => !visible.value.includes(i)).length)
const visibleSelectable = computed(() => visible.value.filter(selectable))
const allChecked = computed(() => visibleSelectable.value.length > 0 && visibleSelectable.value.every((i) => selected.value.has(i)))

const toggleRow = (i) => {
  if (!selectable(i)) return
  const next = new Set(selected.value)
  next.has(i) ? next.delete(i) : next.add(i)
  selected.value = next
}
const toggleAll = () => {
  const next = new Set(selected.value)
  visibleSelectable.value.forEach((i) => (allChecked.value ? next.delete(i) : next.add(i)))
  selected.value = next
}

const expiredTotal = computed(() => providerExpired(summary.value))
const toExpire = computed(() => Number(summary.value.BalanceToExpire) || 0)
const inFavor = computed(() => Number(summary.value.BalanceInFavor) || 0)
const cards = computed(() => [
  { label: 'Deuda por pagar', value: cop(toExpire.value + expiredTotal.value), color: '#283593' },
  { label: 'Valor a favor', value: cop(inFavor.value), color: '#303F9F' },
  { label: 'Saldo proveedor', value: cop(summary.value.TotalBalance), color: '#3F51B5' },
  { label: 'Vencido', value: cop(expiredTotal.value), color: '#5C6BC0' },
  { label: 'Por vencer', value: cop(toExpire.value), color: '#7986CB' },
  { label: 'Documentos', value: loading.value ? '…' : failed.value ? '-' : docs.value.length, color: '#9FA8DA' },
])

const loadDocuments = async () => {
  if (!canDocuments.value) return
  const mine = ++docsToken
  loading.value = true
  failed.value = ''
  docs.value = []
  selected.value = new Set()
  summary.value = { ...props.provider }
  try {
    const res = await AccountPayableService.documents(props.provider.AccountID, {
      MsThirdPartyID: props.provider.MsThirdPartyID,
      all_data: allData.value ? 1 : 0,
    })
    if (mine !== docsToken) return
    docs.value = res.data?.documents ?? []
    summary.value = summarize(docs.value) // el resumen sale de los documentos ya cargados
  } catch (error) {
    if (mine === docsToken) failed.value = errorMessage(error)
  } finally {
    if (mine === docsToken) loading.value = false
  }
}

const loadPayments = async () => {
  if (!canPayments.value) return
  const mine = ++paymentsToken
  loadingPayments.value = true
  paymentsFailed.value = ''
  try {
    const res = await AccountPayableService.payments(props.provider.AccountID)
    if (mine === paymentsToken) payments.value = res.data?.payments ?? []
  } catch (error) {
    if (mine === paymentsToken) {
      payments.value = null // permite reintentar al volver a la pestaña
      paymentsFailed.value = errorMessage(error)
    }
  } finally {
    if (mine === paymentsToken) loadingPayments.value = false
  }
}

watch(tab, (value) => value === 'payments' && payments.value === null && loadPayments())
watch(allData, loadDocuments)
onMounted(loadDocuments)

// Modales
const paymentOpen = ref(false)
const advanceOpen = ref(false)
const conciliationOpen = ref(false)
const plan = ref(null)
const detail = ref(null)

const openConciliation = () => {
  const result = conciliationPlan(selectedDocs.value, docs.value.filter(isReceipt))
  if (result.error) return alerts.error(result.error)
  plan.value = result
  conciliationOpen.value = true
}

// Tras un pago, anticipo o cruce: se recargan documentos y resumen (y los pagos si se están viendo)
const refresh = () => {
  payments.value = null
  loadDocuments()
  if (tab.value === 'payments') loadPayments()
  emit('changed')
}
</script>

<template>
  <div class="fade-in">
    <CButton color="secondary" variant="outline" size="sm" class="mb-3" @click="emit('back')"><CIcon :icon="cilArrowLeft" /> Volver a proveedores</CButton>

    <div class="mb-3">
      <h4 class="mb-0">{{ provider.FullName }}</h4>
      <div class="text-body-secondary">
        <span v-if="provider.CompanyName">{{ provider.CompanyName }} · </span>{{ provider.Identification }}
      </div>
    </div>

    <CFormSwitch v-model="allData" id="ap-all-data" class="mb-3" :disabled="loading || !canDocuments" label="Cargar información completa (orden de compra, bodegas, observaciones) — consulta más lenta" />

    <!-- Leyenda de clasificación -->
    <div class="d-flex flex-wrap gap-3 mb-3 small">
      <span v-for="c in CLASSIFICATIONS" :key="c.key" class="d-inline-flex align-items-center gap-1">
        <span class="rounded-circle d-inline-block" :style="{ width: '12px', height: '12px', background: c.color }" />{{ c.key }} · {{ c.label }}
      </span>
    </div>

    <!-- Resumen -->
    <CRow class="g-3 mb-3">
      <CCol v-for="c in cards" :key="c.label" xs="6" md="4" xl="2">
        <div class="rounded-3 p-3 text-white h-100" :style="{ background: c.color }">
          <div class="fs-5 fw-bold text-nowrap">{{ c.value }}</div>
          <div class="small opacity-75">{{ c.label }}</div>
        </div>
      </CCol>
    </CRow>

    <CAlert v-if="inFavor > 0" color="info" class="mb-3">
      Este proveedor tiene un saldo a favor de <strong>{{ cop(inFavor) }}</strong>. Si deseas realizar el pago, puedes hacerlo normalmente. Si prefieres utilizar este saldo a favor, puedes generar desde aquí el cruce contable para aplicarlo a las facturas correspondientes.
    </CAlert>

    <div v-if="canAdvance" class="mb-3">
      <CButton color="primary" variant="outline" @click="advanceOpen = true"><CIcon :icon="cilMoney" class="me-1" />Realizar anticipo</CButton>
    </div>

    <CCard>
      <CCardHeader class="p-0">
        <CNav variant="tabs" class="px-3 pt-2 border-bottom-0">
          <CNavItem><CNavLink href="#" :active="tab === 'documents'" @click="tab = 'documents'">Documentos</CNavLink></CNavItem>
          <CNavItem><CNavLink href="#" :active="tab === 'payments'" @click="tab = 'payments'">Pagos</CNavLink></CNavItem>
        </CNav>
      </CCardHeader>
      <CCardBody>
        <!-- Documentos -->
        <template v-if="tab === 'documents'">
          <p v-if="!canDocuments" class="text-body-secondary mb-0">No tienes permiso para consultar los documentos del proveedor.</p>
          <Skeleton v-else-if="loading" variant="table" :rows="8" />
          <div v-else-if="failed" class="text-center py-4">
            <p class="text-danger">{{ failed }}</p>
            <CButton color="primary" variant="outline" size="sm" @click="loadDocuments">Reintentar</CButton>
          </div>
          <EmptyState v-else-if="!docs.length" text="Este proveedor no tiene documentos." />
          <template v-else>
            <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
              <div class="input-group" style="max-width: 360px">
                <span class="input-group-text"><CIcon :icon="cilSearch" /></span>
                <input v-model="filters.search" type="search" class="form-control" placeholder="Buscar en los documentos..." aria-label="Buscar en los documentos" />
              </div>
              <CButton color="primary" variant="outline" @click="filtersOpen = true">
                <CIcon :icon="cilFilter" class="me-1" />Filtros<CBadge v-if="activeFilters" color="primary" class="ms-2">{{ activeFilters }}</CBadge>
              </CButton>
              <small class="text-body-secondary">{{ visible.length === docs.length ? `${docs.length} documento(s)` : `${visible.length} de ${docs.length} documento(s)` }}</small>
            </div>

            <div class="table-responsive">
              <table class="table table-sm table-hover align-middle ap-table">
                <thead>
                  <tr>
                    <th style="width: 34px"><input type="checkbox" class="form-check-input" :checked="allChecked" :disabled="!visibleSelectable.length" aria-label="Seleccionar todos" @change="toggleAll" /></th>
                    <th>Tipo</th>
                    <th>Documento</th>
                    <th>Fecha</th>
                    <th>Factura</th>
                    <template v-if="allData">
                      <th>Orden</th>
                      <th>Observaciones</th>
                      <th>Bodegas</th>
                      <th class="text-end">Cantidad</th>
                    </template>
                    <th class="text-end">Valor</th>
                    <th>Fecha vence</th>
                    <th>Estado</th>
                    <th class="text-end">Deuda</th>
                    <th class="text-end">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="i in visible"
                    :key="i"
                    :class="[rowClass(docs[i], meta[i]), { 'ap-selectable': selectable(i) }]"
                    :title="hasError(meta[i]) ? errorTitle(meta[i]) : undefined"
                    @click="toggleRow(i)"
                  >
                    <td @click.stop><input type="checkbox" class="form-check-input" :checked="selected.has(i)" :disabled="!selectable(i)" :aria-label="`Seleccionar ${docs[i].DueName}`" @change="toggleRow(i)" /></td>
                    <td><span class="ap-tag">{{ docs[i].DuePrefix }}</span></td>
                    <td>{{ docs[i].DueName }}</td>
                    <td>{{ day(docs[i].CreatedDate) }}</td>
                    <td>
                      <a v-if="docs[i].Links?.PurchaseInvoice" :href="docs[i].Links.PurchaseInvoice" target="_blank" rel="noopener noreferrer" @click.stop>{{ docs[i].DocName }}</a>
                      <span v-else>{{ docs[i].DocName || '-' }}</span>
                    </td>
                    <template v-if="allData">
                      <td>
                        <a v-if="docs[i].Links?.PurchaseOrder" :href="docs[i].Links.PurchaseOrder" target="_blank" rel="noopener noreferrer" @click.stop>{{ docs[i].PurchaseEntry?.docName }}</a>
                        <span v-else>{{ docs[i].PurchaseEntry?.docName || '-' }}</span>
                      </td>
                      <td style="min-width: 180px">{{ docs[i].PurchaseEntryDetail?.Observations || '-' }}</td>
                      <td style="min-width: 150px">{{ docs[i].PurchaseEntryDetail?.WarehouseCodes }}</td>
                      <td class="text-end">{{ docs[i].PurchaseEntryDetail?.Quantity ? quantity(docs[i].PurchaseEntryDetail.Quantity) : '-' }}</td>
                    </template>
                    <td class="text-end">{{ cop(docs[i].TotalValue) }}</td>
                    <td>{{ day(docs[i].DueDate) }}</td>
                    <td><CBadge :color="estado(docs[i]).color">{{ estado(docs[i]).label }}</CBadge></td>
                    <td class="text-end">{{ cop(docs[i].Deuda) }}</td>
                    <td class="text-end">{{ cop(docs[i].Saldo) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <EmptyState v-if="!visible.length" text="Ningún documento coincide con los filtros." />
          </template>
        </template>

        <!-- Pagos -->
        <template v-else>
          <p v-if="!canPayments" class="text-body-secondary mb-0">No tienes permiso para consultar los pagos del proveedor.</p>
          <Skeleton v-else-if="loadingPayments" variant="table" :rows="6" />
          <div v-else-if="paymentsFailed" class="text-center py-4">
            <p class="text-danger">{{ paymentsFailed }}</p>
            <CButton color="primary" variant="outline" size="sm" @click="loadPayments">Reintentar</CButton>
          </div>
          <PaymentsByMonth v-else-if="payments" :payments="payments" :can-view="canHtml" @view="detail = $event" />
        </template>
      </CCardBody>
    </CCard>

    <!-- Barra de selección -->
    <div v-if="selected.size && tab === 'documents'" class="ap-totals position-sticky bottom-0 mt-3 border rounded-3 p-3 d-flex flex-wrap align-items-center justify-content-between gap-3 shadow">
      <div>
        <div>
          <strong>{{ selected.size }}</strong> documento(s) seleccionado(s)
          <small v-if="hiddenSelected" class="text-body-secondary">({{ hiddenSelected }} oculto(s) por el filtro)</small>
        </div>
        <div class="fs-5 fw-bold">Total a pagar: {{ cop(selectedTotal) }}</div>
      </div>
      <div class="d-flex flex-wrap gap-2">
        <CButton v-if="canConciliate" color="primary" variant="outline" @click="openConciliation">Realizar cruce contable</CButton>
        <CButton v-if="canPay" color="success" @click="paymentOpen = true">Realizar recibo de pago</CButton>
      </div>
    </div>

    <!-- Filtros de documentos -->
    <CModal teleport :visible="filtersOpen" alignment="center" @close="filtersOpen = false">
      <CModalHeader><CModalTitle>Filtros de documentos</CModalTitle></CModalHeader>
      <CModalBody>
        <div class="mb-3">
          <label class="form-label">Tipo de documento</label>
          <ComboSelect v-model="filters.type" :options="typeOptions" placeholder="Todos los tipos" />
        </div>
        <div class="mb-3">
          <label class="form-label">Clasificación</label>
          <ComboSelect v-model="filters.color" :options="colorOptions" placeholder="Todas las clasificaciones" />
        </div>
        <label class="form-label">Rango de fechas</label>
        <ComboSelect v-model="filters.dateField" :options="dateFieldOptions" class="mb-2" />
        <div class="input-group">
          <input v-model="filters.from" type="date" class="form-control" aria-label="Desde" />
          <span class="input-group-text">a</span>
          <input v-model="filters.to" type="date" class="form-control" aria-label="Hasta" />
        </div>
      </CModalBody>
      <CModalFooter>
        <small class="me-auto text-body-secondary">{{ visible.length }} resultado(s)</small>
        <CButton color="secondary" variant="outline" @click="clearFilters">Limpiar</CButton>
        <CButton color="primary" @click="filtersOpen = false">Ver resultados</CButton>
      </CModalFooter>
    </CModal>

    <PaymentModal :visible="paymentOpen" :provider="provider" :docs="selectedDocs" :settings="settings" @close="paymentOpen = false" @done="refresh" />
    <AdvanceModal :visible="advanceOpen" :provider="provider" :settings="settings" @close="advanceOpen = false" @done="refresh" />
    <ConciliationModal :visible="conciliationOpen" :provider="provider" :plan="plan" :settings="settings" @close="conciliationOpen = false" @done="refresh" />
    <PaymentDetailModal :visible="!!detail" :payment="detail" @close="detail = null" />
  </div>
</template>

<style>
/* Colores de fila por clasificación de documento (translúcidos para que funcionen en modo oscuro) */
.ap-table tbody tr.ap-selectable { cursor: pointer; }
.ap-table tbody tr.ap-row-nov1 > td { background: rgba(252, 165, 165, 0.28); }
.ap-table tbody tr.ap-row-nov2 > td { background: rgba(134, 239, 172, 0.28); }
.ap-table tbody tr.ap-row-nov3 > td { background: rgba(147, 197, 253, 0.28); }
.ap-table tbody tr.ap-row-nov4 > td { background: rgba(253, 186, 116, 0.28); }
.ap-table tbody tr.ap-row-nov5 > td { background: rgba(253, 224, 71, 0.28); }
.ap-table tbody tr.ap-row-des1 > td { background: rgba(216, 180, 254, 0.28); }
.ap-table tbody tr.ap-row-rp > td { background: rgba(156, 163, 175, 0.2); }
.ap-table tbody tr.ap-row-err1 > td { background: rgba(115, 115, 115, 0.3); }
.ap-table tbody tr.ap-row-err2 > td { background: rgba(121, 85, 72, 0.25); }
.ap-tag { display: inline-block; padding: 0.1rem 0.5rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; background: rgba(156, 163, 175, 0.3); }
.ap-row-err1 .ap-tag { background: #000; color: #fff; }
.ap-row-err2 .ap-tag { background: #795548; color: #fff; }
.ap-totals { background: var(--cui-body-bg); z-index: 5; }
</style>
