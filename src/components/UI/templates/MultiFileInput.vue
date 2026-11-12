<script setup>
import { cilTrash } from '@coreui/icons'
import { ref } from 'vue'

// Varios archivos (fotos, evidencias). v-model es un arreglo de File; con previsualización cuando son imágenes.
const model = defineModel({ default: () => [] })
const props = defineProps({
  accept: { type: String, default: 'image/png,image/jpeg,image/webp' },
  maxMb: { type: Number, default: 10 },
  max: { type: Number, default: 0 }, // 0 = sin límite
  invalid: Boolean,
})
const emit = defineEmits(['rejected'])
const input = ref(null)
const urls = new WeakMap()
const preview = (file) => {
  if (!file.type?.startsWith('image/')) return ''
  if (!urls.has(file)) urls.set(file, URL.createObjectURL(file))
  return urls.get(file)
}

const add = (files) => {
  const list = [...model.value]
  for (const file of files) {
    if (file.size > props.maxMb * 1024 * 1024) {
      emit('rejected', `${file.name} supera ${props.maxMb} MB.`)
      continue
    }
    if (props.max && list.length >= props.max) {
      emit('rejected', `Máximo ${props.max} archivos.`)
      break
    }
    list.push(file)
  }
  model.value = list
}
const onChange = (event) => {
  add(event.target.files)
  event.target.value = ''
}
const remove = (index) => {
  const file = model.value[index]
  if (urls.has(file)) URL.revokeObjectURL(urls.get(file))
  model.value = model.value.filter((_, i) => i !== index)
}
</script>

<template>
  <div>
    <CButton color="primary" variant="outline" size="sm" :class="{ 'border-danger': invalid }" @click="input.click()">Agregar archivos</CButton>
    <input ref="input" type="file" class="d-none" multiple :accept="accept" @change="onChange" />
    <div v-if="model.length" class="d-flex flex-wrap gap-2 mt-3">
      <div v-for="(file, i) in model" :key="`${file.name}-${i}`" class="border rounded-3 p-2 d-flex align-items-center gap-2" style="max-width: 260px">
        <img v-if="preview(file)" :src="preview(file)" :alt="file.name" class="rounded" style="width: 44px; height: 44px; object-fit: cover" />
        <span class="small text-truncate" :title="file.name">{{ file.name }}</span>
        <CButton color="danger" variant="ghost" size="sm" aria-label="Quitar archivo" @click="remove(i)"><CIcon :icon="cilTrash" /></CButton>
      </div>
    </div>
  </div>
</template>
