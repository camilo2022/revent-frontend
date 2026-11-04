<script setup>
import { computed, ref } from 'vue'
import { cilPlus, cilTrash } from '@coreui/icons'

// v-model: [{ color_id, description, size_ids: [] }]
const model = defineModel({ type: Array, default: () => [] })
const props = defineProps({
  colors: { type: Array, default: () => [] },
  sizes: { type: Array, default: () => [] },
})

const newColor = ref('')
const colorName = (id) => props.colors.find((c) => c.id === id)?.name ?? `Color ${id}`
// Colores que aún no se han agregado
const available = computed(() => props.colors.filter((c) => !model.value.some((m) => m.color_id === c.id)))

const addColor = () => {
  if (!newColor.value) return
  model.value.push({ color_id: Number(newColor.value), description: null, size_ids: [] })
  newColor.value = ''
}
const removeColor = (i) => model.value.splice(i, 1)

const toggleSize = (item, sizeId) => {
  const at = item.size_ids.indexOf(sizeId)
  if (at >= 0) item.size_ids.splice(at, 1)
  else item.size_ids.push(sizeId)
}
</script>

<template>
  <div>
    <div class="d-flex gap-2 mb-3">
      <CFormSelect v-model="newColor" style="max-width: 280px">
        <option value="">Selecciona un color...</option>
        <option v-for="c in available" :key="c.id" :value="c.id">{{ c.name }} ({{ c.settings?.code }})</option>
      </CFormSelect>
      <CButton color="primary" variant="outline" :disabled="!newColor" @click="addColor"><CIcon :icon="cilPlus" /> Agregar color</CButton>
    </div>

    <p v-if="!model.length" class="text-body-secondary">Aún no hay colores. Agrega al menos uno.</p>

    <CCard v-for="(item, i) in model" :key="item.color_id" class="mb-2 border">
      <CCardBody class="py-2">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <strong>{{ colorName(item.color_id) }}</strong>
          <CButton color="danger" variant="ghost" size="sm" @click="removeColor(i)"><CIcon :icon="cilTrash" /> Quitar</CButton>
        </div>
        <div class="d-flex flex-wrap gap-3">
          <CFormCheck
            v-for="s in sizes"
            :key="s.id"
            :id="`c${item.color_id}-s${s.id}`"
            :label="s.name"
            :checked="item.size_ids.includes(s.id)"
            @change="toggleSize(item, s.id)"
          />
        </div>
        <small v-if="!item.size_ids.length" class="text-body-secondary">Selecciona las tallas de este color.</small>
      </CCardBody>
    </CCard>
  </div>
</template>
