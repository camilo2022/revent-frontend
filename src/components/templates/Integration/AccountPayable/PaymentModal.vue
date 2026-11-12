<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { cilCheckAlt } from '@coreui/icons'
import AccountPayableService from '@/services/integration/AccountPayableService'
import { useServerErrors } from '@/composables/useServerErrors'
import { useAlertStore } from '@/stores/alertStore'
import { confirmAction } from '@/utils/swal'
import Button from '@/components/UI/templates/Button.vue'
import ErrorSummary from '@/components/UI/templates/ErrorSummary.vue'
import VoucherFields from './VoucherFields.vue'
import { cop, day, slimDoc, slimProvider, todayBogota } from './helpers'

// Recibo de pago: el valor a pagar se reparte en cascada sobre los documentos elegidos, en el orden de la tabla
const props = defineProps({
  visible: Boolean,
  provider: Object,
  docs: { type: Array, default: () => [] },
  settings: { type: Object, required: true },
})
const emit = defineEmits(['close', 'done'])
const alerts = useAlertStore()
const { get, handle, clear, errors, attributes, message } = useServerErrors()

const busy = ref(false)
const form = reactive({ tipo: '', accion: '0', origen: '', fecha: '', valor: 0, observaciones: '', comprobante: null })
const actions = [{ value: '0', label: 'Abono a deuda' }]

const total = computed(() => props.docs.reduce((sum, d) => sum + (Number(d.Saldo) || 0), 0))

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100

// Cubrimiento de cada documento con el valor a pagar
const coverage = computed(() => {
  let remaining = Number(form.valor) || 0
  return props.docs.map((doc) => {
    const saldo = Number(doc.Saldo) || 0
    const covered = round2(Math.max(0, Math.min(remaining, saldo)))
    remaining -= covered
    return { doc, saldo, covered }
  })
})
const coveredTotal = computed(() => round2(coverage.value.reduce((sum, c) => sum + c.covered, 0)))
const coverClass = (c) => (c.covered <= 0 ? 'text-body-tertiary' : c.covered >= c.saldo ? 'text-success fw-bold' : 'text-warning fw-bold')

watch(
  () => props.visible,
  (open) => {
    if (!open) return
    clear()
    Object.assign(form, { tipo: '', accion: '0', origen: '', fecha: todayBogota(), valor: round2(total.value), observaciones: '', comprobante: null })
  },
)

const submit = async () => {
  clear()
  const rows = coverage.value.filter((c) => c.covered > 0)
  if (!rows.length) return alerts.warning('El valor a pagar no cubre ninguno de los documentos seleccionados.')
  if (!form.tipo || !form.accion || !form.origen || !form.fecha || !form.observaciones || !form.comprobante) {
    return alerts.warning('Completa todos los campos antes de confirmar.')
  }
  if (!(await confirmAction({ title: '¿Realizar pago?', text: 'Esta acción no se puede deshacer.', confirmText: 'Sí, realizar pago', icon: 'warning' }))) return

  busy.value = true
  try {
    await AccountPayableService.paymentStore({
      proveedor: slimProvider(props.provider),
      tipo: form.tipo,
      accion: form.accion,
      origen: form.origen,
      fecha: form.fecha,
      observaciones: form.observaciones,
      valor: coveredTotal.value,
      documentos: rows.map((c) => ({ doc: slimDoc(c.doc), covered: c.covered })),
      comprobante: form.comprobante,
    })
    emit('done')
    emit('close')
  } catch (error) {
    handle(error)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <CModal teleport :visible="visible" size="xl" scrollable backdrop="static" alignment="center" @close="emit('close')">
    <CModalHeader><CModalTitle>Realizar recibo de pago</CModalTitle></CModalHeader>
    <CModalBody>
      <CAlert v-if="message && !Object.keys(errors).length" color="danger" class="mb-3">{{ message }}</CAlert>
      <ErrorSummary :errors="errors" :attributes="attributes" />
      <VoucherFields :form="form" :settings="settings" :actions="actions" value-label="Valor a pagar" :get="get" />

      <CTable small responsive class="mb-3">
        <CTableHead>
          <CTableRow>
            <CTableHeaderCell>Tipo</CTableHeaderCell>
            <CTableHeaderCell>Documento</CTableHeaderCell>
            <CTableHeaderCell>Factura</CTableHeaderCell>
            <CTableHeaderCell>Fecha vence</CTableHeaderCell>
            <CTableHeaderCell class="text-end">Saldo</CTableHeaderCell>
            <CTableHeaderCell class="text-end">Cubre</CTableHeaderCell>
          </CTableRow>
        </CTableHead>
        <CTableBody>
          <CTableRow v-for="c in coverage" :key="c.doc.DueName">
            <CTableDataCell><span class="badge text-bg-light border">{{ c.doc.DuePrefix }}</span></CTableDataCell>
            <CTableDataCell>{{ c.doc.DueName }}</CTableDataCell>
            <CTableDataCell>{{ c.doc.DocName || '-' }}</CTableDataCell>
            <CTableDataCell>{{ day(c.doc.DueDate) }}</CTableDataCell>
            <CTableDataCell class="text-end">{{ cop(c.saldo) }}</CTableDataCell>
            <CTableDataCell class="text-end" :class="coverClass(c)">{{ cop(c.covered) }}</CTableDataCell>
          </CTableRow>
        </CTableBody>
      </CTable>

      <div class="border rounded-3 p-3 d-flex flex-column gap-1">
        <div class="d-flex justify-content-between"><span>Saldo total documentos:</span><strong>{{ cop(total) }}</strong></div>
        <div class="d-flex justify-content-between"><span>Total cubierto:</span><strong>{{ cop(coveredTotal) }}</strong></div>
      </div>
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" :disabled="busy" @click="emit('close')">Cancelar</CButton>
      <Button :loading="busy" permission="integration.accounts_payable.payment_store" :icon="cilCheckAlt" @click="submit">Confirmar recibo de pago</Button>
    </CModalFooter>
  </CModal>
</template>
