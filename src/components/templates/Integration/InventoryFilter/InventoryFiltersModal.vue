<script setup>
import { computed, reactive, watch } from 'vue'
import ComboSelect from '@/components/UI/templates/ComboSelect.vue'
import FormField from '@/components/UI/templates/FormField.vue'
import { colorsOfMacro, PRICE_RANGES } from './helpers'

// Filtros avanzados: tipo de producto, tono y color, precio y talla. Se editan en una copia y se aplican con «Ver resultados».
const visible = defineModel('visible', { default: false })
const props = defineProps({
  filters: { type: Object, required: true },
  categories: { type: Array, default: () => [] },
  sizes: { type: Array, default: () => [] },
  macros: { type: Array, default: () => [] },
  groups: { type: Array, default: () => [] },
  count: { type: Number, default: 0 }, // resultados con los filtros ya aplicados
})
const emit = defineEmits(['apply', 'clear'])

const draft = reactive({})
watch(visible, (open) => open && Object.assign(draft, props.filters), { immediate: true })

const list = (values, all) => [{ value: '', label: all }, ...values.map((v) => ({ value: v, label: v }))]
const colors = computed(() => colorsOfMacro(props.groups, draft.macro))
const swatch = computed(() => colors.value.find((c) => c.nombre === draft.color)?.hex || '#9CA3AF')

const apply = () => {
  emit('apply', { ...draft })
  visible.value = false
}
const clear = () => {
  emit('clear')
  visible.value = false
}
</script>

<template>
  <CModal teleport :visible="visible" alignment="center" scrollable @close="visible = false">
    <CModalHeader><CModalTitle>Filtros avanzados</CModalTitle></CModalHeader>
    <CModalBody>
      <div class="d-flex flex-column gap-3">
        <FormField label="Tipo de producto"><ComboSelect v-model="draft.category" :options="list(categories, 'Todos')" /></FormField>
        <FormField v-if="macros.length" label="Tono">
          <ComboSelect v-model="draft.macro" :options="list(macros, 'Todos')" @change="draft.color = ''" />
        </FormField>
        <FormField v-if="draft.macro && colors.length" label="Color">
          <div class="d-flex align-items-center gap-2">
            <span class="d-inline-block rounded-circle border flex-shrink-0" :style="{ width: '20px', height: '20px', background: swatch }"></span>
            <ComboSelect v-model="draft.color" class="flex-grow-1" :options="list(colors.map((c) => c.nombre), 'Todos')" />
          </div>
        </FormField>
        <FormField label="Rango de precio"><ComboSelect v-model="draft.price" :options="PRICE_RANGES" /></FormField>
        <FormField v-if="sizes.length" label="Talla"><ComboSelect v-model="draft.size" :options="list(sizes, 'Todas')" /></FormField>
      </div>
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="clear">Limpiar</CButton>
      <CButton color="primary" @click="apply">Aplicar filtros</CButton>
    </CModalFooter>
  </CModal>
</template>
