<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { cilCloudUpload, cilX } from '@coreui/icons'
import { RECEIPT_MAX_MB, receiptError } from './helpers'

// Comprobante del pago o anticipo: imagen JPG o PNG (máx. 8 MB) con vista previa; v-model es el File elegido
const model = defineModel()
defineProps({ invalid: Boolean })

const input = ref(null)
const dragging = ref(false)
const problem = ref('')
const preview = ref('')

watch(model, (file) => {
  if (preview.value) URL.revokeObjectURL(preview.value)
  preview.value = file instanceof File ? URL.createObjectURL(file) : ''
})
onBeforeUnmount(() => preview.value && URL.revokeObjectURL(preview.value))

const size = computed(() => {
  const bytes = model.value?.size ?? 0
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`
})

const pick = (file) => {
  problem.value = receiptError(file)
  model.value = problem.value ? null : file
  if (problem.value && input.value) input.value.value = ''
}
const remove = () => {
  model.value = null
  problem.value = ''
  if (input.value) input.value.value = ''
}
const onDrop = (event) => {
  dragging.value = false
  if (event.dataTransfer.files.length) pick(event.dataTransfer.files[0])
}
</script>

<template>
  <div>
    <div
      v-if="!model"
      class="border border-2 rounded-3 text-center p-4 text-body-secondary"
      :class="[dragging ? 'border-primary bg-primary-subtle' : invalid || problem ? 'border-danger' : '', 'border-dashed']"
      style="cursor: pointer; border-style: dashed !important"
      role="button"
      tabindex="0"
      @click="input.click()"
      @keydown.enter.prevent="input.click()"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="onDrop"
    >
      <CIcon :icon="cilCloudUpload" size="xl" class="mb-1" />
      <div>Arrastra una imagen aquí o <span class="text-primary fw-semibold">selecciónala</span></div>
      <small>JPG o PNG (máx. {{ RECEIPT_MAX_MB }} MB)</small>
    </div>
    <div v-else class="d-flex align-items-center gap-3 border rounded-3 p-2">
      <img :src="preview" alt="Vista previa del comprobante" class="rounded" style="width: 64px; height: 64px; object-fit: cover" />
      <div class="flex-grow-1 text-truncate">
        <div class="fw-semibold text-truncate">{{ model.name }}</div>
        <small class="text-body-secondary">{{ size }}</small>
      </div>
      <CButton color="secondary" variant="ghost" size="sm" aria-label="Quitar el comprobante" @click="remove"><CIcon :icon="cilX" /></CButton>
    </div>
    <input ref="input" type="file" class="d-none" accept=".jpg,.jpeg,.png" @change="pick($event.target.files[0])" />
    <div v-if="problem" class="text-danger small mt-1">{{ problem }}</div>
  </div>
</template>
