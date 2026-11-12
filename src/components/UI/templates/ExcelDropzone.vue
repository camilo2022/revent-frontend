<script setup>
import { cilCloudUpload } from '@coreui/icons'
import { ref } from 'vue'

// Zona para soltar o elegir un archivo (Excel, ZIP...). v-model es el File elegido.
const model = defineModel()
const props = defineProps({
  accept: { type: String, default: '.xlsx,.xls' },
  label: { type: String, default: 'Arrastra el archivo aquí o haz clic para elegirlo' },
  maxMb: { type: Number, default: 20 },
  invalid: Boolean,
})
const emit = defineEmits(['rejected'])
const over = ref(false)
const input = ref(null)

const pick = (file) => {
  if (!file) return
  if (file.size > props.maxMb * 1024 * 1024) {
    emit('rejected', `El archivo supera ${props.maxMb} MB.`)
    return
  }
  model.value = file
}
const onDrop = (event) => {
  over.value = false
  pick(event.dataTransfer.files[0])
}
const onChange = (event) => {
  pick(event.target.files[0])
  event.target.value = ''
}
</script>

<template>
  <div
    class="border border-2 rounded-3 p-4 text-center"
    :class="[over ? 'border-primary bg-primary-subtle' : invalid ? 'border-danger' : 'border-secondary-subtle']"
    style="border-style: dashed !important; cursor: pointer"
    role="button"
    tabindex="0"
    @click="input.click()"
    @keydown.enter.prevent="input.click()"
    @dragover.prevent="over = true"
    @dragleave.prevent="over = false"
    @drop.prevent="onDrop"
  >
    <CIcon :icon="cilCloudUpload" size="xl" class="text-body-secondary mb-2" />
    <div v-if="model" class="fw-semibold">{{ model.name }} <small class="text-body-secondary">({{ (model.size / 1024).toFixed(0) }} KB)</small></div>
    <div v-else class="text-body-secondary">{{ label }}</div>
    <div class="small text-body-secondary">Máximo {{ maxMb }} MB</div>
    <CButton v-if="model" color="link" size="sm" class="text-danger" @click.stop="model = null">Quitar</CButton>
    <input ref="input" type="file" class="d-none" :accept="accept" @change="onChange" />
  </div>
</template>
