<script setup>
import { reactive, watch } from 'vue'
import ComboSelect from '@/components/UI/templates/ComboSelect.vue'
import FormField from '@/components/UI/templates/FormField.vue'

// Filtros avanzados del seguimiento. Se editan en una copia y se aplican con «Ver resultados».
const visible = defineModel('visible', { default: false })
const props = defineProps({
  filters: { type: Object, required: true },
  options: { type: Object, required: true }, // { ref, model, color, size, warehouse, user }
  count: { type: Number, default: 0 },
})
const emit = defineEmits(['apply', 'clear'])

const draft = reactive({})
watch(visible, (open) => open && Object.assign(draft, props.filters), { immediate: true })

const list = (values) => [{ value: '', label: 'Todos' }, ...(values ?? []).map((v) => ({ value: v, label: v }))]
const STATUS = [
  { value: '', label: 'Todos los estados' },
  { value: 'completa', label: 'Completo' },
  { value: 'faltantes', label: 'Faltantes' },
]
const VALID = [
  { value: '', label: 'Todas las OC' },
  { value: 'valida', label: 'Válida' },
  { value: 'anulada', label: 'Anulada' },
]
const AGING = [
  { value: '', label: 'Todas las antigüedades' },
  { value: 'age-red', label: 'Vencido · más de 4 meses' },
  { value: 'age-orange', label: 'Por vencer · más de 1 mes y hasta 4 meses' },
  { value: 'age-green', label: 'Reciente · hasta 1 mes' },
]
const DATE_FIELD = [
  { value: 'order', label: 'Fecha de orden de compra' },
  { value: 'invoice', label: 'Fecha de factura' },
]

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
  <CModal teleport :visible="visible" size="lg" alignment="center" scrollable @close="visible = false">
    <CModalHeader><CModalTitle>Filtros avanzados</CModalTitle></CModalHeader>
    <CModalBody>
      <CRow class="g-3">
        <CCol md="4"><FormField label="Estado de recepción"><ComboSelect v-model="draft.status" :options="STATUS" /></FormField></CCol>
        <CCol md="4"><FormField label="Validez de la OC"><ComboSelect v-model="draft.valid" :options="VALID" /></FormField></CCol>
        <CCol md="4"><FormField label="Antigüedad"><ComboSelect v-model="draft.aging" :options="AGING" /></FormField></CCol>

        <CCol md="4"><FormField label="Rango de fechas"><ComboSelect v-model="draft.dateField" :options="DATE_FIELD" /></FormField></CCol>
        <CCol md="4"><FormField label="Desde"><input v-model="draft.from" type="date" class="form-control" /></FormField></CCol>
        <CCol md="4"><FormField label="Hasta"><input v-model="draft.to" type="date" class="form-control" /></FormField></CCol>

        <CCol md="4"><FormField label="Referencia"><ComboSelect v-model="draft.ref" :options="list(options.ref)" /></FormField></CCol>
        <CCol md="4"><FormField label="Modelo"><ComboSelect v-model="draft.model" :options="list(options.model)" /></FormField></CCol>
        <CCol md="4"><FormField label="Color"><ComboSelect v-model="draft.color" :options="list(options.color)" /></FormField></CCol>
        <CCol md="4"><FormField label="Talla"><ComboSelect v-model="draft.size" :options="list(options.size)" /></FormField></CCol>
        <CCol md="4"><FormField label="Bodega"><ComboSelect v-model="draft.warehouse" :options="list(options.warehouse)" /></FormField></CCol>
        <CCol md="4"><FormField label="Usuario"><ComboSelect v-model="draft.user" :options="list(options.user)" /></FormField></CCol>
      </CRow>
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="clear">Limpiar</CButton>
      <CButton color="primary" @click="apply">Aplicar filtros</CButton>
    </CModalFooter>
  </CModal>
</template>
