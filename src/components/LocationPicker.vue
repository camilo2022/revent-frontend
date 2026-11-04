<script setup>
import { computed } from 'vue'
import { countryService, departmentService, cityService } from '@/services/location.service'
import RemoteSelect from './RemoteSelect.vue'

// Ubicación polimórfica: tipo (país/departamento/ciudad) + búsqueda remota del registro
const type = defineModel('type')
const id = defineModel('id')
defineProps({ initialLabel: { type: String, default: '' }, invalid: Boolean })

const kinds = [
  { value: 'App\\Models\\Country', label: 'País', service: countryService },
  { value: 'App\\Models\\Department', label: 'Departamento', service: departmentService },
  { value: 'App\\Models\\City', label: 'Ciudad', service: cityService },
]
const kind = computed(() => kinds.find((k) => k.value === type.value))

const changeType = (value) => {
  type.value = value
  id.value = ''
}
</script>

<template>
  <div class="d-flex flex-column flex-md-row gap-2">
    <CFormSelect :model-value="type" style="max-width: 200px" :invalid="invalid" @update:model-value="changeType">
      <option value="">Tipo...</option>
      <option v-for="k in kinds" :key="k.value" :value="k.value">{{ k.label }}</option>
    </CFormSelect>
    <div class="flex-grow-1">
      <RemoteSelect
        v-if="kind"
        :key="kind.value"
        v-model="id"
        :service="kind.service"
        :initial-label="initialLabel"
        :placeholder="`Buscar ${kind.label.toLowerCase()}...`"
        :invalid="invalid"
      />
      <CFormInput v-else disabled placeholder="Primero elige el tipo" />
    </div>
  </div>
</template>
