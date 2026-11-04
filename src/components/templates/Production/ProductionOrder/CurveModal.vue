<script setup>
import { computed, ref, watch } from 'vue'
import { distributeCurve, parseProportions } from '@/utils/orderMatrix'
import FormField from '@/components/UI/templates/FormField.vue'

// Asistente de curva: reparte un total de pares según la proporción por talla
const props = defineProps({
  visible: Boolean,
  sizes: { type: Array, default: () => [] }, // tallas (columnas) del color
  stores: { type: Array, default: () => [] }, // tiendas elegidas del color [{ id, label }]
})
const emit = defineEmits(['close', 'apply'])

const text = ref('')
const total = ref('')
const target = ref('all')

watch(() => props.visible, (v) => {
  if (v) {
    text.value = ''
    total.value = ''
    target.value = 'all'
  }
})

const proportions = computed(() => parseProportions(text.value))
const totalNumber = computed(() => Math.floor(Number(total.value)) || 0)

// Mensaje de validación (vacío si todo está bien)
const problem = computed(() => {
  if (!text.value) return ''
  if (!proportions.value) return 'Usa números separados por coma, por ejemplo 1,2,3,3,2,1.'
  if (proportions.value.length !== props.sizes.length) return `Debes ingresar ${props.sizes.length} proporciones (una por talla).`
  if (proportions.value.every((p) => p === 0)) return 'Al menos una proporción debe ser mayor que cero.'
  return ''
})

const result = computed(() =>
  proportions.value && !problem.value ? distributeCurve(proportions.value, totalNumber.value) : null,
)
const valid = computed(() => result.value && totalNumber.value > 0 && props.stores.length > 0)

const apply = () => {
  const values = {}
  props.sizes.forEach((s, i) => (values[s.id] = result.value[i]))
  const ids = target.value === 'all' ? props.stores.map((s) => s.id) : [Number(target.value)]
  emit('apply', { storeIds: ids, values })
}
</script>

<template>
  <CModal :visible="visible" alignment="center" @close="emit('close')">
    <CModalHeader><CModalTitle>Aplicar curva</CModalTitle></CModalHeader>
    <CModalBody>
      <p class="text-body-secondary small">
        Tallas: <strong>{{ sizes.map((s) => s.size?.name).join(' · ') }}</strong>. Ingresa la proporción de cada talla
        y el total de pares por tienda; el reparto suma exacto.
      </p>
      <FormField label="Proporción por talla" :error="problem">
        <CFormInput v-model="text" placeholder="1,2,3,3,2,1" :invalid="!!problem" />
      </FormField>
      <FormField label="Total de pares por tienda">
        <CFormInput v-model="total" type="number" min="1" />
      </FormField>
      <FormField label="Aplicar a">
        <CFormSelect v-model="target">
          <option value="all">Todas las tiendas del color ({{ stores.length }})</option>
          <option v-for="s in stores" :key="s.id" :value="s.id">{{ s.label }}</option>
        </CFormSelect>
      </FormField>
      <div v-if="result && totalNumber" class="small">
        Vista previa:
        <CBadge v-for="(q, i) in result" :key="i" color="light" class="text-body border ms-1">{{ sizes[i].size?.name }}: {{ q }}</CBadge>
      </div>
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="emit('close')">Cancelar</CButton>
      <CButton color="primary" :disabled="!valid" @click="apply">Aplicar</CButton>
    </CModalFooter>
  </CModal>
</template>
