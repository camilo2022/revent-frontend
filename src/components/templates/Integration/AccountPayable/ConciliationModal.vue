<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { cilCheckAlt } from '@coreui/icons'
import AccountPayableService from '@/services/integration/AccountPayableService'
import { useServerErrors } from '@/composables/useServerErrors'
import { useAlertStore } from '@/stores/alertStore'
import { confirmAction } from '@/utils/swal'
import Button from '@/components/UI/templates/Button.vue'
import ComboSelect from '@/components/UI/templates/ComboSelect.vue'
import ErrorSummary from '@/components/UI/templates/ErrorSummary.vue'
import FormField from '@/components/UI/templates/FormField.vue'
import { cop, day, slimDoc, slimProvider, todayBogota } from './helpers'

// Cruce contable: aplica el saldo a favor (recibos de pago) a los documentos elegidos. El plan ya viene calculado.
const props = defineProps({
  visible: Boolean,
  provider: Object,
  plan: Object, // resultado de conciliationPlan
  settings: { type: Object, required: true },
})
const emit = defineEmits(['close', 'done'])
const alerts = useAlertStore()
const { get, handle, clear, errors, attributes, message } = useServerErrors()

const busy = ref(false)
const form = reactive({ tipo: '', fecha: '', observaciones: '' })

const types = computed(() =>
  (props.settings.type_documents ?? []).map((t) => ({ value: t.ERPDocumentTypeID, label: `${t.ERPDocClass}-${t.ERPDocCode}-${t.Name}` })),
)

watch(
  () => props.visible,
  (open) => {
    if (!open) return
    clear()
    Object.assign(form, { tipo: '', fecha: todayBogota(), observaciones: '' })
  },
)

const submit = async () => {
  clear()
  if (!form.tipo || !form.fecha || !form.observaciones) return alerts.warning('Completa el tipo de documento, la fecha de elaboración y las observaciones.')
  if (!(await confirmAction({ title: '¿Realizar cruce contable?', text: 'Esta acción no se puede deshacer.', confirmText: 'Sí, realizar cruce', icon: 'warning' }))) return

  busy.value = true
  try {
    await AccountPayableService.conciliationStore({
      proveedor: slimProvider(props.provider),
      tipo: form.tipo,
      fecha: form.fecha,
      observaciones: form.observaciones,
      documentos: props.plan.debts.map((d) => ({ doc: slimDoc(d.doc), saldo: d.saldo, covered: d.covered })),
      recibos: props.plan.receipts.map((r) => ({ doc: slimDoc(r.doc), saldo: r.saldo, used: r.used })),
    })
    emit('done')
    emit('close')
  } catch (error) {
    handle(error)
  } finally {
    busy.value = false
  }
}

const rows = computed(() => [
  ...(props.plan?.receipts ?? []).map((r) => ({ doc: r.doc, saldo: r.saldo, amount: r.used, kind: 'RP' })),
  ...(props.plan?.debts ?? []).map((d) => ({ doc: d.doc, saldo: d.saldo, amount: d.covered, kind: 'Deuda' })),
])
</script>

<template>
  <CModal teleport :visible="visible && !!plan" size="xl" scrollable backdrop="static" alignment="center" @close="emit('close')">
    <CModalHeader><CModalTitle>Realizar cruce contable</CModalTitle></CModalHeader>
    <CModalBody v-if="plan">
      <CAlert v-if="message && !Object.keys(errors).length" color="danger" class="mb-3">{{ message }}</CAlert>
      <ErrorSummary :errors="errors" :attributes="attributes" />
      <CRow>
        <CCol md="6">
          <FormField label="Tipo de documento" required :error="get('tipo')">
            <ComboSelect v-model="form.tipo" :options="types" :invalid="!!get('tipo')" />
          </FormField>
          <FormField label="Fecha de elaboración" required :error="get('fecha')">
            <input v-model="form.fecha" type="date" class="form-control" />
          </FormField>
        </CCol>
        <CCol md="6">
          <FormField label="Observaciones" required :error="get('observaciones')">
            <textarea v-model="form.observaciones" rows="5" class="form-control" placeholder="Escribe cualquier observación sobre este cruce..." />
          </FormField>
        </CCol>
      </CRow>

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
          <CTableRow v-for="r in rows" :key="`${r.kind}-${r.doc.DueName}`">
            <CTableDataCell><span class="badge text-bg-light border">{{ r.doc.DuePrefix }}</span></CTableDataCell>
            <CTableDataCell>{{ r.doc.DueName }}</CTableDataCell>
            <CTableDataCell>{{ r.doc.DocName || '-' }}</CTableDataCell>
            <CTableDataCell>{{ day(r.doc.DueDate) }}</CTableDataCell>
            <CTableDataCell class="text-end">{{ cop(r.saldo) }}</CTableDataCell>
            <CTableDataCell class="text-end" :class="r.amount >= r.saldo ? 'text-success fw-bold' : 'text-warning fw-bold'">{{ cop(r.amount) }}</CTableDataCell>
          </CTableRow>
        </CTableBody>
      </CTable>

      <div class="border rounded-3 p-3 d-flex flex-column gap-1">
        <div class="d-flex justify-content-between"><span>Saldo a favor disponible (RP):</span><strong>{{ cop(plan.receiptTotal) }}</strong></div>
        <div class="d-flex justify-content-between"><span>Total a conciliar:</span><strong>{{ cop(plan.debtTotal) }}</strong></div>
        <div class="d-flex justify-content-between"><span>Total cubierto:</span><strong>{{ cop(plan.coveredTotal) }}</strong></div>
      </div>
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" :disabled="busy" @click="emit('close')">Cancelar</CButton>
      <Button :loading="busy" permission="integration.accounts_payable.conciliation_store" :icon="cilCheckAlt" @click="submit">Confirmar cruce contable</Button>
    </CModalFooter>
  </CModal>
</template>
