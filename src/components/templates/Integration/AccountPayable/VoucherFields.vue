<script setup>
import { computed } from 'vue'
import ComboSelect from '@/components/UI/templates/ComboSelect.vue'
import FormField from '@/components/UI/templates/FormField.vue'
import ReceiptFile from './ReceiptFile.vue'

// Campos comunes del recibo de pago y del anticipo. `form` es el objeto reactivo de la ventana que lo usa.
const props = defineProps({
  form: { type: Object, required: true },
  settings: { type: Object, required: true }, // { type_receipt, bank_accounts, type_documents }
  actions: { type: Array, required: true }, // [{ value, label }] de "Realizar un"
  valueLabel: { type: String, default: 'Valor a pagar' },
  valueReadonly: Boolean,
  get: { type: Function, default: () => '' }, // error del servidor por campo
  commentHint: { type: String, default: '' },
})

const types = computed(() => {
  const t = props.settings.type_receipt
  return t ? [{ value: t.ERPDocumentTypeId, label: `${t.DocClass}-${t.Code} · ${t.Title}` }] : []
})
const banks = computed(() => (props.settings.bank_accounts ?? []).map((b) => ({ value: b.ACPaymentMeanID, label: b.PaymentMeanAccount })))
</script>

<template>
  <CRow>
    <CCol md="6">
      <FormField label="Tipo" required :error="get('tipo')">
        <ComboSelect v-model="form.tipo" :options="types" :invalid="!!get('tipo')" />
      </FormField>
    </CCol>
    <CCol md="6">
      <FormField label="Realizar un" required :error="get('accion')">
        <ComboSelect v-model="form.accion" :options="actions" :invalid="!!get('accion')" />
      </FormField>
    </CCol>
    <CCol md="6">
      <FormField label="De dónde sale el dinero" required :error="get('origen')">
        <ComboSelect v-model="form.origen" :options="banks" :invalid="!!get('origen')" />
      </FormField>
    </CCol>
    <CCol md="6">
      <FormField label="Fecha de elaboración" required :error="get('fecha')">
        <input v-model="form.fecha" type="date" class="form-control" />
      </FormField>
    </CCol>
    <CCol md="6">
      <FormField :label="valueLabel" required :error="get('valor')">
        <input v-model.number="form.valor" type="number" min="0" step="0.01" class="form-control" :readonly="valueReadonly" placeholder="0" />
      </FormField>
    </CCol>
    <CCol md="6" />
    <CCol md="6">
      <FormField label="Observaciones" required :error="get('observaciones')" :hint="commentHint">
        <textarea v-model="form.observaciones" rows="5" class="form-control" placeholder="Escribe cualquier observación sobre este recibo..." />
      </FormField>
    </CCol>
    <CCol md="6">
      <FormField label="Comprobante" required :error="get('comprobante')">
        <ReceiptFile v-model="form.comprobante" :invalid="!!get('comprobante')" />
      </FormField>
    </CCol>
  </CRow>
</template>
