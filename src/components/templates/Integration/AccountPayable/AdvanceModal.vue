<script setup>
import { reactive, ref, watch } from 'vue'
import { cilCheckAlt } from '@coreui/icons'
import AccountPayableService from '@/services/integration/AccountPayableService'
import { useServerErrors } from '@/composables/useServerErrors'
import { useAlertStore } from '@/stores/alertStore'
import { confirmAction } from '@/utils/swal'
import Button from '@/components/UI/templates/Button.vue'
import ErrorSummary from '@/components/UI/templates/ErrorSummary.vue'
import VoucherFields from './VoucherFields.vue'
import { cop, slimProvider, todayBogota } from './helpers'

// Anticipo: recibo sin documentos asociados
const props = defineProps({ visible: Boolean, provider: Object, settings: { type: Object, required: true } })
const emit = defineEmits(['close', 'done'])
const alerts = useAlertStore()
const { get, handle, clear, errors, attributes, message } = useServerErrors()

const busy = ref(false)
const form = reactive({ tipo: '', accion: '1', origen: '', fecha: '', valor: null, observaciones: '', comprobante: null })
const actions = [{ value: '1', label: 'Anticipo' }]

watch(
  () => props.visible,
  (open) => {
    if (!open) return
    clear()
    Object.assign(form, { tipo: '', accion: '1', origen: '', fecha: todayBogota(), valor: null, observaciones: '', comprobante: null })
  },
)

const submit = async () => {
  clear()
  const valor = Number(form.valor) || 0
  if (!form.tipo || !form.accion || !form.origen || !form.fecha || !form.observaciones || !form.comprobante || valor <= 0) {
    return alerts.warning('Completa todos los campos y define un valor a anticipar mayor a cero.')
  }
  if (!(await confirmAction({ title: '¿Realizar anticipo?', text: 'Esta acción no se puede deshacer.', confirmText: 'Sí, realizar anticipo', icon: 'warning' }))) return

  busy.value = true
  try {
    await AccountPayableService.advanceStore({
      proveedor: slimProvider(props.provider),
      tipo: form.tipo,
      accion: form.accion,
      origen: form.origen,
      fecha: form.fecha,
      observaciones: form.observaciones,
      valor,
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
  <CModal teleport :visible="visible" size="lg" scrollable backdrop="static" alignment="center" @close="emit('close')">
    <CModalHeader><CModalTitle>Realizar anticipo</CModalTitle></CModalHeader>
    <CModalBody>
      <CAlert v-if="message && !Object.keys(errors).length" color="danger" class="mb-3">{{ message }}</CAlert>
      <ErrorSummary :errors="errors" :attributes="attributes" />
      <VoucherFields :form="form" :settings="settings" :actions="actions" value-label="Valor pagado" :get="get" />
      <div class="border rounded-3 p-3 d-flex justify-content-between">
        <span>Total a anticipar:</span><strong>{{ cop(form.valor) }}</strong>
      </div>
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" :disabled="busy" @click="emit('close')">Cancelar</CButton>
      <Button :loading="busy" permission="integration.accounts_payable.advance_store" :icon="cilCheckAlt" @click="submit">Confirmar anticipo</Button>
    </CModalFooter>
  </CModal>
</template>
