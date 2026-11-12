<script setup>
import { ref, watch } from 'vue'
import AccountPayableService from '@/services/integration/AccountPayableService'
import { errorMessage } from '@/utils/format'
import Skeleton from '@/components/UI/templates/Skeleton.vue'

// Detalle (HTML de Siigo) de un recibo de pago. Se muestra en un iframe aislado (sandbox sin scripts).
const props = defineProps({ visible: Boolean, payment: Object })
const emit = defineEmits(['close'])

const html = ref('')
const error = ref('')
const loading = ref(false)
let token = 0

watch(
  () => [props.visible, props.payment?.ACEntryID],
  async ([open]) => {
    if (!open || !props.payment) return
    const mine = ++token
    html.value = ''
    error.value = ''
    loading.value = true
    try {
      const res = await AccountPayableService.paymentHtml(props.payment.ACEntryID)
      if (mine === token) html.value = res.data?.html ?? ''
    } catch (e) {
      if (mine === token) error.value = errorMessage(e)
    } finally {
      if (mine === token) loading.value = false
    }
  },
)
</script>

<template>
  <CModal teleport :visible="visible" size="xl" alignment="center" @close="emit('close')">
    <CModalHeader><CModalTitle>Detalle · {{ payment?.DocName }}</CModalTitle></CModalHeader>
    <CModalBody class="p-0">
      <Skeleton v-if="loading" variant="form" :rows="4" class="p-3" />
      <p v-else-if="error" class="text-danger p-3 mb-0">{{ error }}</p>
      <p v-else-if="!html" class="text-body-secondary p-3 mb-0">Sin detalle disponible.</p>
      <iframe v-else sandbox="" :srcdoc="html" title="Detalle del recibo de pago" style="width: 100%; height: 65vh; border: 0; display: block; background: #fff" />
    </CModalBody>
  </CModal>
</template>
