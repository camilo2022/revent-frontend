<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'

// Subida de imagen con vista previa; v-model es el File elegido
const model = defineModel()
const props = defineProps({ currentUrl: { type: String, default: '' }, invalid: Boolean, accept: { type: String, default: 'image/png,image/jpeg' } })

const preview = ref('')
watch(model, (file) => {
  if (preview.value) URL.revokeObjectURL(preview.value)
  preview.value = file instanceof File ? URL.createObjectURL(file) : ''
})
onBeforeUnmount(() => preview.value && URL.revokeObjectURL(preview.value))

const shown = computed(() => preview.value || props.currentUrl)
const onChange = (event) => {
  model.value = event.target.files[0] ?? null
}
</script>

<template>
  <div class="d-flex align-items-center gap-3">
    <img v-if="shown" :src="shown" alt="Vista previa" class="rounded border" style="width: 72px; height: 72px; object-fit: cover" />
    <input type="file" class="form-control" :class="{ 'is-invalid': invalid }" :accept="accept" @change="onChange" />
  </div>
</template>
