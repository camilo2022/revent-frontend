<script setup>
import { computed, ref } from 'vue'
import { cilChevronBottom, cilChevronRight, cilFile, cilSearch, cilX } from '@coreui/icons'
import AccountPayableService from '@/services/integration/AccountPayableService'
import { useAlertStore } from '@/stores/alertStore'
import { useAuthStore } from '@/stores/authStore'
import EmptyState from '@/components/UI/templates/EmptyState.vue'
import Skeleton from '@/components/UI/templates/Skeleton.vue'
import PaymentDetailModal from './PaymentDetailModal.vue'
import { cop, day, firstError } from './helpers'

// Pagos de todos los proveedores agrupados por semana (lunes a domingo) y, dentro de cada semana, por proveedor
const auth = useAuthStore()
const alerts = useAlertStore()

const from = ref('')
const to = ref('')
const data = ref(null) // { desde, hasta, weeks }
const loading = ref(false)
const error = ref('')
const detail = ref(null)
const open = ref(new Set()) // claves "w" y "w-p" desplegadas
let token = 0

const weeks = computed(() => data.value?.weeks ?? [])
const totalPayments = computed(() => weeks.value.reduce((sum, w) => sum + (Number(w.cantidad) || 0), 0))
const totalAmount = computed(() => weeks.value.reduce((sum, w) => sum + (Number(w.total) || 0), 0))
const canView = computed(() => auth.can('integration.accounts_payable.payment_html'))

const toggle = (key) => {
  const next = new Set(open.value)
  next.has(key) ? next.delete(key) : next.add(key)
  open.value = next
}

const search = async () => {
  // Se envían ambas fechas o ninguna (sin fechas: todo el año hasta hoy)
  if ((from.value && !to.value) || (!from.value && to.value)) {
    return alerts.warning('Debes indicar la fecha inicial y la final, o dejar ambas vacías para consultar todo el año.')
  }
  if (from.value && to.value && from.value > to.value) return alerts.warning('La fecha inicial no puede ser mayor que la final.')

  const mine = ++token
  loading.value = true
  error.value = ''
  data.value = null
  open.value = new Set()
  try {
    const res = await AccountPayableService.paymentsWeekly(from.value ? { date_from: from.value, date_to: to.value } : {})
    if (mine === token) data.value = res.data?.weekly ?? null
  } catch (e) {
    if (mine === token) error.value = firstError(e)
  } finally {
    if (mine === token) loading.value = false
  }
}

const clear = () => {
  token++ // invalida una consulta en curso
  from.value = ''
  to.value = ''
  data.value = null
  error.value = ''
  loading.value = false
  open.value = new Set()
}
</script>

<template>
  <div>
    <CAlert color="info">
      <strong>¿Cómo funciona esta consulta?</strong>
      <ul class="mb-0 mt-1">
        <li>Trae los recibos de pago de <strong>todos los proveedores</strong>. Si no eliges fechas, consulta <strong>desde el 1 de enero del año actual hasta hoy</strong>.</li>
        <li>Si eliges fechas debes indicar <strong>ambas</strong> (desde y hasta).</li>
        <li>Los pagos se agrupan por <strong>semana</strong> (lunes a domingo; la primera y la última pueden estar incompletas) y, dentro de cada semana, por <strong>proveedor</strong>. El total suma el valor pagado más los anticipos.</li>
        <li>Consultar un rango amplio (por ejemplo, todo el año) puede tardar varios minutos.</li>
      </ul>
    </CAlert>

    <div class="d-flex flex-wrap align-items-end gap-2 mb-3">
      <div>
        <label class="form-label" for="ap-weekly-from">Desde</label>
        <input id="ap-weekly-from" v-model="from" type="date" class="form-control" />
      </div>
      <div>
        <label class="form-label" for="ap-weekly-to">Hasta</label>
        <input id="ap-weekly-to" v-model="to" type="date" class="form-control" />
      </div>
      <CButton color="primary" :disabled="loading" @click="search"><CSpinner v-if="loading" size="sm" class="me-1" /><CIcon v-else :icon="cilSearch" class="me-1" />Consultar pagos</CButton>
      <CButton color="secondary" variant="outline" @click="clear"><CIcon :icon="cilX" class="me-1" />Limpiar</CButton>
    </div>

    <template v-if="loading">
      <p class="text-body-secondary">Espera un momento, consultando los pagos de todos los proveedores...</p>
      <Skeleton variant="table" :rows="6" />
    </template>
    <p v-else-if="error" class="text-danger">{{ error }}</p>
    <EmptyState v-else-if="!data" text="Presiona «Consultar pagos» para ver los pagos agrupados por semana." />
    <template v-else>
      <p class="mb-3">
        Del <strong>{{ day(data.desde) }}</strong> al <strong>{{ day(data.hasta) }}</strong> · <strong>{{ weeks.length }}</strong> semana(s) ·
        <strong>{{ totalPayments }}</strong> pago(s) · Total <strong>{{ cop(totalAmount) }}</strong>
      </p>
      <EmptyState v-if="!weeks.length" text="No hay pagos en el rango consultado." />
      <CTable v-else small hover responsive>
        <CTableHead>
          <CTableRow>
            <CTableHeaderCell style="width: 44px" />
            <CTableHeaderCell>Semana</CTableHeaderCell>
            <CTableHeaderCell>Proveedores</CTableHeaderCell>
            <CTableHeaderCell>Pagos</CTableHeaderCell>
            <CTableHeaderCell class="text-end">Total</CTableHeaderCell>
          </CTableRow>
        </CTableHead>
        <CTableBody>
          <template v-for="(week, w) in weeks" :key="`${week.semana}-${week.label}`">
            <CTableRow class="fw-semibold">
              <CTableDataCell>
                <CButton color="secondary" variant="ghost" size="sm" :aria-label="open.has(`${w}`) ? 'Ocultar proveedores' : 'Mostrar proveedores'" @click="toggle(`${w}`)">
                  <CIcon :icon="open.has(`${w}`) ? cilChevronBottom : cilChevronRight" />
                </CButton>
              </CTableDataCell>
              <CTableDataCell>Semana {{ week.semana }} · {{ week.label }}</CTableDataCell>
              <CTableDataCell>{{ week.proveedores.length }}</CTableDataCell>
              <CTableDataCell>{{ week.cantidad }}</CTableDataCell>
              <CTableDataCell class="text-end">{{ cop(week.total) }}</CTableDataCell>
            </CTableRow>

            <CTableRow v-if="open.has(`${w}`)">
              <CTableDataCell colspan="5" class="bg-body-tertiary">
                <CTable small class="mb-0">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell style="width: 44px" />
                      <CTableHeaderCell>Proveedor</CTableHeaderCell>
                      <CTableHeaderCell>Identificación</CTableHeaderCell>
                      <CTableHeaderCell>Pagos</CTableHeaderCell>
                      <CTableHeaderCell class="text-end">Total</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    <template v-for="(provider, p) in week.proveedores" :key="`${provider.identificacion}-${p}`">
                      <CTableRow>
                        <CTableDataCell>
                          <CButton color="secondary" variant="ghost" size="sm" :aria-label="open.has(`${w}-${p}`) ? 'Ocultar pagos' : 'Mostrar pagos'" @click="toggle(`${w}-${p}`)">
                            <CIcon :icon="open.has(`${w}-${p}`) ? cilChevronBottom : cilChevronRight" />
                          </CButton>
                        </CTableDataCell>
                        <CTableDataCell>{{ provider.proveedor }}</CTableDataCell>
                        <CTableDataCell>{{ provider.identificacion }}</CTableDataCell>
                        <CTableDataCell>{{ provider.cantidad }}</CTableDataCell>
                        <CTableDataCell class="text-end">{{ cop(provider.total) }}</CTableDataCell>
                      </CTableRow>

                      <CTableRow v-if="open.has(`${w}-${p}`)">
                        <CTableDataCell colspan="5">
                          <CTable small class="mb-0">
                            <CTableHead>
                              <CTableRow>
                                <CTableHeaderCell>Tipo</CTableHeaderCell>
                                <CTableHeaderCell>Documento</CTableHeaderCell>
                                <CTableHeaderCell>Fecha</CTableHeaderCell>
                                <CTableHeaderCell class="text-end">Valor</CTableHeaderCell>
                                <CTableHeaderCell>Estado</CTableHeaderCell>
                                <CTableHeaderCell class="text-center">Ver</CTableHeaderCell>
                              </CTableRow>
                            </CTableHead>
                            <CTableBody>
                              <CTableRow v-for="payment in provider.pagos" :key="payment.ACEntryID" :class="{ 'table-danger': payment.IsAnnulled }">
                                <CTableDataCell><span class="badge text-bg-light border">{{ payment.DocClass }}</span></CTableDataCell>
                                <CTableDataCell>
                                  <a v-if="payment.Link" :href="payment.Link" target="_blank" rel="noopener noreferrer">{{ payment.DocName || '-' }}</a>
                                  <span v-else>{{ payment.DocName || '-' }}</span>
                                </CTableDataCell>
                                <CTableDataCell>{{ day(payment.DocDate) }}</CTableDataCell>
                                <CTableDataCell class="text-end">{{ cop(payment.Total) }}</CTableDataCell>
                                <CTableDataCell><CBadge :color="payment.IsAnnulled ? 'secondary' : 'success'">{{ payment.IsAnnulled ? 'Anulado' : 'Activo' }}</CBadge></CTableDataCell>
                                <CTableDataCell class="text-center">
                                  <CButton color="primary" variant="ghost" size="sm" :disabled="!canView" :title="canView ? 'Ver detalle' : 'No tienes permiso para esta acción'" aria-label="Ver detalle del pago" @click="detail = payment">
                                    <CIcon :icon="cilFile" />
                                  </CButton>
                                </CTableDataCell>
                              </CTableRow>
                            </CTableBody>
                          </CTable>
                        </CTableDataCell>
                      </CTableRow>
                    </template>
                  </CTableBody>
                </CTable>
              </CTableDataCell>
            </CTableRow>
          </template>
        </CTableBody>
      </CTable>
    </template>

    <PaymentDetailModal :visible="!!detail" :payment="detail" @close="detail = null" />
  </div>
</template>
