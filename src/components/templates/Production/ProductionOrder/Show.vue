<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { cilPencil } from '@coreui/icons'
import ProductionOrderService from '@/services/ProductionOrderService'
import { usePermissions } from '@/composables/usePermissions'
import { confirmAction, notify, notifyError } from '@/utils/swal'
import { date, errorMessage, money } from '@/utils/format'
import LoadingForm from '@/components/UI/templates/Skeleton.vue'
import StatusBadge from '@/components/UI/templates/StatusBadge.vue'
import OrderDetailMatrix from './OrderDetailMatrix.vue'

const props = defineProps({ id: [String, Number] })
const { can } = usePermissions()
const emit = defineEmits(['edit', 'back'])
const order = ref(null)
const busy = ref(false)

const load = async () => {
  order.value = null
  try {
    order.value = (await ProductionOrderService.find(props.id)).data.production_order
  } catch (error) {
    notifyError(errorMessage(error))
  }
}
onMounted(load)
watch(() => props.id, load)

// Aprobar y cancelar según estado y permiso
const actions = computed(() =>
  [
    { key: 'approved', label: 'Aprobar', color: 'success', permission: 'production_orders.approved', when: ['Pendiente'], text: 'La orden quedará aprobada y ya no se podrá editar.' },
    { key: 'canceled', label: 'Cancelar', color: 'danger', permission: 'production_orders.canceled', when: ['Pendiente', 'Aprobado'], text: 'La orden quedará cancelada.' },
  ].filter((a) => a.when.includes(order.value?.status) && can(a.permission)),
)

const run = async (action) => {
  if (!(await confirmAction({ title: `¿${action.label} la orden ${order.value.consecutive}?`, text: action.text }))) return
  busy.value = true
  try {
    order.value = (await ProductionOrderService[action.key](order.value.id)).data.production_order
    notify('Acción realizada')
  } catch (error) {
    notifyError(errorMessage(error))
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <LoadingForm v-if="!order" variant="form" />
  <template v-else>
    <CCard class="mb-4">
      <CCardHeader class="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <strong>Orden {{ order.consecutive }} <StatusBadge :status="order.status" class="ms-2" /></strong>
        <div class="d-flex gap-2">
          <CButton color="secondary" variant="outline" size="sm" @click="emit('back')">Volver</CButton>
          <CButton v-if="can('production_orders.update') && order.status === 'Pendiente'" color="primary" variant="outline" size="sm" @click="emit('edit')"><CIcon :icon="cilPencil" /> Editar</CButton>
          <CButton v-for="a in actions" :key="a.key" :color="a.color" size="sm" :disabled="busy" @click="run(a)">{{ a.label }}</CButton>
        </div>
      </CCardHeader>
      <CCardBody>
        <CRow class="mb-2">
          <CCol md="3"><small class="text-body-secondary d-block">Proveedor</small>{{ order.supplier?.trade_name || order.supplier?.legal_name }}</CCol>
          <CCol md="3">
            <small class="text-body-secondary d-block">Producto</small>
            {{ order.technical_sheet?.product?.code }} · {{ order.technical_sheet?.product?.name }}
          </CCol>
          <CCol md="2"><small class="text-body-secondary d-block">Vence</small>{{ date(order.due_date) }}</CCol>
          <CCol md="2"><small class="text-body-secondary d-block">% IVA</small>{{ order.vat_percentage }}</CCol>
          <CCol md="2"><small class="text-body-secondary d-block">% Remisión</small>{{ order.delivery_note_percentage }}</CCol>
        </CRow>
        <div class="d-flex gap-5 mt-3">
          <div><small class="text-body-secondary d-block">Pares</small><span class="fs-4 fw-semibold">{{ order.totals?.pairs }}</span></div>
          <div><small class="text-body-secondary d-block">Colores</small><span class="fs-4 fw-semibold">{{ order.totals?.colors }}</span></div>
          <div><small class="text-body-secondary d-block">Tiendas</small><span class="fs-4 fw-semibold">{{ order.totals?.stores }}</span></div>
        </div>
      </CCardBody>
    </CCard>

    <CCard v-for="d in order.details" :key="d.id" class="mb-3">
      <CCardHeader class="d-flex flex-wrap justify-content-between align-items-center">
        <strong>{{ d.color?.name }} <small class="text-body-secondary">{{ d.code }}</small></strong>
        <span class="small text-body-secondary">Costo {{ money(d.cost) }} · Precio {{ money(d.price) }} · {{ d.total }} pares</span>
      </CCardHeader>
      <CCardBody>
        <p v-if="d.observation" class="small mb-2"><strong>Observación:</strong> {{ d.observation }}</p>
        <OrderDetailMatrix :detail="d" />
      </CCardBody>
    </CCard>
  </template>
</template>
