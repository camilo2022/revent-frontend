<script setup>
import { computed, reactive, ref } from 'vue'
import { cilCheckCircle, cilSearch } from '@coreui/icons'
import PurchaseOrderReceptionService from '@/services/integration/PurchaseOrderReceptionService'
import { useAlertStore } from '@/stores/alertStore'
import { useServerErrors } from '@/composables/useServerErrors'
import { useSiigoCredentials } from '@/composables/useSiigoCredentials'
import { dateText } from '../PurchaseOrderTracking/helpers'
import Button from '@/components/UI/templates/Button.vue'
import EmptyState from '@/components/UI/templates/EmptyState.vue'
import ErrorSummary from '@/components/UI/templates/ErrorSummary.vue'
import FormField from '@/components/UI/templates/FormField.vue'
import RequiredNote from '@/components/UI/templates/RequiredNote.vue'
import SiigoCredentialNotice from '@/components/UI/templates/SiigoCredentialNotice.vue'
import ReceptionChecklist from './ReceptionChecklist.vue'
import { buildReceiving, emptyChecklist, orderValue, orderWarehouse, pending, pendingText, qty, receivable, toReceivingItems, totals } from './helpers'

// Recepción de órdenes de compra: se busca la orden, se anota cuánto llegó de cada ítem, se llena la lista de verificación
// y se adjuntan las fotos. Al confirmar se envía el correo de recepción. Necesita tu token de Siigo («Autorización Siigo»).
const alerts = useAlertStore()
const { get, errors, attributes, message, handle, clear } = useServerErrors()
const { ready } = useSiigoCredentials(['token'])

const query = ref('')
const searching = ref(false)
const searched = ref(false) // ya se buscó (para distinguir «sin buscar» de «no existe»)
const order = ref(null)
const items = ref([])
const checklist = reactive(emptyChecklist())
const images = ref([])
const saving = ref(false)
const done = ref(null) // { images, sent_to }

const t = computed(() => totals(items.value))
const blocked = computed(() => items.value.filter((i) => !i.Accessible))
const receivableCount = computed(() => receivable(items.value).length)
const hasQuantity = computed(() => receivable(items.value).some((i) => Number(i.ReceivingQuantity) > 0))

const reset = () => {
  order.value = null
  items.value = []
  images.value = []
  done.value = null
  searched.value = false
  Object.assign(checklist, emptyChecklist())
  clear()
}

const search = async () => {
  reset()
  searching.value = true
  alerts.muted = true // consultar no es una escritura: sin aviso de «operación completada»
  try {
    const res = await PurchaseOrderReceptionService.search(query.value.trim())
    order.value = res.data.invoice_purchase_order
    items.value = toReceivingItems(order.value)
    searched.value = true
  } catch (error) {
    handle(error)
  } finally {
    alerts.muted = false
    searching.value = false
  }
}

// El campo de cantidad no admite negativos ni más de lo solicitado sin avisar: se marca en color pero se deja corregir
const setQuantity = (item, value) => {
  const n = Number(value)
  item.ReceivingQuantity = Number.isFinite(n) && n >= 0 ? n : 0
}
const receiveAll = () => receivable(items.value).forEach((i) => (i.ReceivingQuantity = Number(i.Quantity) || 0))
const stateClass = (item) => {
  const r = Number(item.ReceivingQuantity) || 0
  const q = Number(item.Quantity) || 0
  return r > q ? 'border-info' : r === q ? 'border-success' : 'border-warning'
}

const confirm = async () => {
  clear()
  saving.value = true
  try {
    const res = await PurchaseOrderReceptionService.confirm({ receiving: buildReceiving(order.value, items.value, checklist), imagenes: images.value })
    done.value = res.data.reception
  } catch (error) {
    handle(error)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="d-flex flex-column gap-4 fade-in">
    <SiigoCredentialNotice />

    <!-- Recepción registrada -->
    <CCard v-if="done">
      <CCardBody class="text-center py-5">
        <CIcon :icon="cilCheckCircle" size="3xl" class="text-success mb-3" />
        <h5>Recepción registrada</h5>
        <p class="text-body-secondary mb-1">La recepción de <strong>{{ orderValue(order, 'DocName') }}</strong> quedó guardada con {{ done.images }} {{ done.images === 1 ? 'foto' : 'fotos' }} de evidencia.</p>
        <p class="text-body-secondary">Se envió el correo de confirmación a {{ done.sent_to.join(', ') }}.</p>
        <CButton color="primary" @click="query = ''; reset()">Recibir otra orden</CButton>
      </CCardBody>
    </CCard>

    <template v-else>
      <!-- Búsqueda -->
      <CCard>
        <CCardHeader><strong>Recepción de orden de compra</strong></CCardHeader>
        <CCardBody>
          <p class="text-body-secondary">Escribe el número de la orden de compra de Siigo para registrar lo que llegó a la bodega.</p>
          <form novalidate @submit.prevent="search">
            <FormField label="Orden de compra" required :error="get('query')">
              <div class="d-flex gap-2">
                <input v-model="query" type="text" class="form-control" placeholder="Ej: OC-1-12345" autocomplete="off" style="max-width: 360px" />
                <Button type="submit" :loading="searching" :disabled="!query.trim() || !ready" permission="integration.purchase_order_reception.search" :icon="cilSearch">Buscar</Button>
              </div>
            </FormField>
            <p v-if="get('token')" class="text-danger small mb-0">{{ get('token') }}</p>
          </form>
        </CCardBody>
      </CCard>

      <EmptyState v-if="searched && !order" text="No se encontró una orden de compra con ese número." />

      <template v-if="order">
        <!-- Encabezado y resumen -->
        <CCard>
          <CCardBody>
            <div class="d-flex flex-wrap justify-content-between gap-3">
              <div>
                <div class="fs-5 fw-semibold">{{ orderValue(order, 'DocName') ?? '-' }}</div>
                <div class="text-body-secondary small">Fecha: <strong>{{ dateText(orderValue(order, 'DocDate')) }}</strong> · Bodega: <strong>{{ orderWarehouse(receivable(items)) || '-' }}</strong></div>
                <div v-if="orderValue(order, 'Observations')" class="text-body-secondary small mt-1">Observaciones: {{ orderValue(order, 'Observations') }}</div>
              </div>
              <div class="d-flex gap-4 text-center">
                <div><div class="text-body-secondary small">Solicitada</div><div class="fs-5 fw-semibold">{{ qty(t.requested) }}</div></div>
                <div><div class="text-body-secondary small">Ingresando</div><div class="fs-5 fw-semibold text-success">{{ qty(t.receiving) }}</div></div>
                <div><div class="text-body-secondary small">Pendiente</div><div :class="['fs-5 fw-semibold', t.pending < 0 ? 'text-warning' : 'text-info']">{{ pendingText(t.pending) }}</div></div>
              </div>
            </div>
          </CCardBody>
        </CCard>

        <CAlert v-if="blocked.length" color="warning" class="mb-0">
          {{ blocked.length }} {{ blocked.length === 1 ? 'ítem es' : 'ítems son' }} de bodegas de tiendas que no tienes asignadas y no se pueden recibir con tu usuario. Pide que te asignen la tienda correspondiente.
        </CAlert>

        <!-- Ítems -->
        <CCard>
          <CCardHeader class="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <strong>Ítems de la orden</strong>
            <CButton color="secondary" variant="outline" size="sm" :disabled="!receivableCount" @click="receiveAll">Recibir todo lo solicitado</CButton>
          </CCardHeader>
          <CCardBody class="p-0">
            <EmptyState v-if="!items.length" text="Esta orden no tiene ítems." />
            <div v-else class="table-responsive">
              <table class="table align-middle small mb-0">
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th>Referencia</th>
                    <th>Color</th>
                    <th>Categoría</th>
                    <th>Talla</th>
                    <th>Bodega</th>
                    <th class="text-end">Solicitada</th>
                    <th style="width: 130px">Ingresando</th>
                    <th class="text-end">Pendiente</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, i) in items" :key="i" :class="{ 'text-body-secondary': !item.Accessible }">
                    <td>{{ item.LongDescription || item.Description || '-' }}</td>
                    <td>{{ item.Reference || '-' }}</td>
                    <td>{{ item.Color || '-' }}</td>
                    <td>{{ item.Category || '-' }}</td>
                    <td>{{ item.Size || '-' }}</td>
                    <td>{{ item.Warehouse || '-' }} <CBadge v-if="!item.Accessible" color="warning">Sin acceso</CBadge></td>
                    <td class="text-end">{{ qty(item.Quantity) }}</td>
                    <td>
                      <input :value="item.ReceivingQuantity" type="number" min="0" step="1" :disabled="!item.Accessible" :class="['form-control form-control-sm', stateClass(item)]" :aria-label="`Cantidad que ingresa de ${item.LongDescription || item.Description}`" @input="setQuantity(item, $event.target.value)" />
                    </td>
                    <td class="text-end"><span :class="item.Accessible ? (pending(item) < 0 ? 'text-warning' : 'text-info') : ''">{{ item.Accessible ? pendingText(pending(item)) : '-' }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CCardBody>
        </CCard>

        <!-- Lista de verificación -->
        <CCard v-if="receivableCount">
          <CCardHeader><strong>Lista de verificación de la recepción</strong></CCardHeader>
          <CCardBody>
            <CAlert v-if="message && !Object.keys(errors).length" color="danger">{{ message }}</CAlert>
            <ErrorSummary :errors="errors" :attributes="attributes" />
            <ReceptionChecklist v-model:checklist="checklist" v-model:images="images" :get="get" @rejected="alerts.warning" />
            <div class="d-flex flex-wrap align-items-center gap-3 mt-4">
              <Button :loading="saving" :disabled="!hasQuantity || !ready" permission="integration.purchase_order_reception.confirm" :icon="cilCheckCircle" @click="confirm">Confirmar recepción</Button>
              <span v-if="!hasQuantity" class="text-body-secondary small">Anota la cantidad que ingresa de al menos un ítem.</span>
              <RequiredNote />
            </div>
          </CCardBody>
        </CCard>
      </template>
    </template>
  </div>
</template>
