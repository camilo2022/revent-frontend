<script setup>
import { computed, ref, watch } from 'vue'

// Selección múltiple de tiendas; `selected` son las ya agregadas (no se pueden repetir)
const props = defineProps({
  visible: Boolean,
  stores: { type: Array, default: () => [] },
  selected: { type: Array, default: () => [] },
})
const emit = defineEmits(['close', 'confirm'])

const search = ref('')
const checked = ref([])

watch(() => props.visible, (v) => {
  if (v) {
    search.value = ''
    checked.value = []
  }
})

const list = computed(() => {
  const q = search.value.trim().toLowerCase()
  return props.stores.filter((s) => !props.selected.includes(s.id) && `${s.code} ${s.name}`.toLowerCase().includes(q))
})

const toggle = (id) => {
  const at = checked.value.indexOf(id)
  if (at >= 0) checked.value.splice(at, 1)
  else checked.value.push(id)
}
const toggleAll = () => {
  checked.value = checked.value.length === list.value.length ? [] : list.value.map((s) => s.id)
}
</script>

<template>
  <CModal :visible="visible" scrollable alignment="center" @close="emit('close')">
    <CModalHeader><CModalTitle>Agregar tiendas</CModalTitle></CModalHeader>
    <CModalBody>
      <CFormInput v-model="search" placeholder="Buscar tienda..." class="mb-2" />
      <CButton color="link" size="sm" class="px-0 mb-2" @click="toggleAll">
        {{ checked.length === list.length && list.length ? 'Quitar selección' : 'Seleccionar todas' }}
      </CButton>
      <p v-if="!list.length" class="text-body-secondary">No hay tiendas disponibles.</p>
      <CFormCheck
        v-for="s in list"
        :key="s.id"
        :id="`store-pick-${s.id}`"
        :label="`${s.code} · ${s.name}`"
        :checked="checked.includes(s.id)"
        @change="toggle(s.id)"
      />
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="emit('close')">Cancelar</CButton>
      <CButton color="primary" :disabled="!checked.length" @click="emit('confirm', checked)">Agregar ({{ checked.length }})</CButton>
    </CModalFooter>
  </CModal>
</template>
