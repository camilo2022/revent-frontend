<script setup>
import { cilBan, cilCheckAlt } from '@coreui/icons'
import { computed, ref } from 'vue'

// Lista de casillas con búsqueda, opcionalmente agrupada. Cada cambio se avisa al padre.
const props = defineProps({
  items: { type: Array, default: () => [] }, // [{ id, label, group }]
  selected: { type: Array, default: () => [] },
  busy: Boolean,
})
const emit = defineEmits(['toggle', 'toggle-group'])

const search = ref('')
const groups = computed(() => {
  const q = search.value.trim().toLowerCase()
  const map = new Map()
  props.items
    .filter((i) => i.label.toLowerCase().includes(q))
    .forEach((i) => {
      const g = i.group ?? ''
      if (!map.has(g)) map.set(g, [])
      map.get(g).push(i)
    })
  return [...map].map(([name, list]) => ({ name, list }))
})
const allChecked = (list) => list.every((i) => props.selected.includes(i.id))
</script>

<template>
  <div>
    <CFormInput v-model="search" placeholder="Buscar..." class="mb-3" style="max-width: 300px" />
    <p v-if="!groups.length" class="text-body-secondary">Sin resultados.</p>
    <div v-for="g in groups" :key="g.name" class="mb-3">
      <div v-if="g.name" class="d-flex align-items-center gap-3 border-bottom pb-1 mb-2">
        <strong>{{ g.name }}</strong>
        <CButton color="link" size="sm" class="p-0" :disabled="busy" @click="emit('toggle-group', g.list, !allChecked(g.list))">
          <CIcon :icon="allChecked(g.list) ? cilBan : cilCheckAlt" /> {{ allChecked(g.list) ? 'Quitar todos' : 'Marcar todos' }}
        </CButton>
      </div>
      <div class="row">
        <div v-for="i in g.list" :key="i.id" class="col-md-6 col-lg-4">
          <CFormSwitch
            :id="`chk-${i.id}`"
            :label="i.label"
            :checked="selected.includes(i.id)"
            :disabled="busy"
            @change="emit('toggle', i, !selected.includes(i.id))"
          />
        </div>
      </div>
    </div>
  </div>
</template>
