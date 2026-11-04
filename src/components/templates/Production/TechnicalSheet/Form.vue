<script setup>
import { confirmAction } from '@/utils/swal'
import ComboSelect from '@/components/UI/templates/ComboSelect.vue'
import { cilSave } from '@coreui/icons'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import TechnicalSheetService from '@/services/TechnicalSheetService'
import ProductService from '@/services/ProductService'
import { useOptions } from '@/composables/useOptions'
import { useServerErrors } from '@/composables/useServerErrors'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import FormField from '@/components/UI/templates/FormField.vue'
import LoadingForm from '@/components/UI/templates/Skeleton.vue'
import ErrorSummary from '@/components/UI/templates/ErrorSummary.vue'
import RequiredNote from '@/components/UI/templates/RequiredNote.vue'
import KeyValueEditor from '@/components/UI/templates/KeyValueEditor.vue'

// Formulario compartido de crear (sin id) y editar (con id)
const props = defineProps({ id: [String, Number] })
const emit = defineEmits(['saved', 'cancel'])
const { options, loadOptions } = useOptions()
const { errors, message, attributes, get, clear, handle } = useServerErrors()
const route = useRoute()
// Aviso de cambios sin guardar (campos + especificaciones)
const { mark, confirmLeave } = useUnsavedChanges(() => JSON.stringify({ form, specs: specs.value }))

const loading = ref(true)
const saving = ref(false)
const products = ref([]) // productos sin ficha (solo al crear)
const sheet = ref(null)
const specs = ref([])
const form = reactive({
  product_id: '',
  trademark_id: '', category_id: '', subcategory_id: '',
  process: '', description: '', observation: '',
})

// Solo las subcategorías asignadas a la categoría elegida
const subcategories = computed(() => {
  const category = options.categories.find((c) => c.id === Number(form.category_id))
  return category?.subcategories ?? []
})

onMounted(async () => {
  await loadOptions(['trademarks', 'categories', 'subcategories'])
  try {
    if (props.id) {
      sheet.value = (await TechnicalSheetService.find(props.id)).data.technical_sheet
      const s = sheet.value
      Object.assign(form, {
        product_id: s.product_id, trademark_id: s.trademark_id, category_id: s.category_id, subcategory_id: s.subcategory_id,
        process: s.process ?? '', description: s.description ?? '', observation: s.observation ?? '',
      })
      specs.value = Object.entries(s.specifications ?? {}).map(([key, value]) => ({ key, value }))
    } else {
      const res = await ProductService.all()
      products.value = res.data.products.filter((p) => !p.technical_sheet)
      // Llegó desde "Crear producto": deja el producto ya elegido
      const preset = Number(route.query.product_id)
      if (preset && products.value.some((p) => p.id === preset)) form.product_id = preset
    }
  } catch (error) {
    handle(error)
  }
  loading.value = false
  mark()
})

// Pares clave/valor => objeto { clave: valor }
const specsObject = () =>
  Object.fromEntries(specs.value.filter((r) => r.key.trim()).map((r) => [r.key.trim(), r.value]))

const save = async () => {
  const editing = !!props.id
  const ok = await confirmAction({
    title: editing ? '¿Desea actualizar la ficha técnica?' : '¿Desea guardar la ficha técnica?',
    text: editing ? 'Se actualizarán los datos.' : 'Se creará el registro.',
    confirmText: editing ? 'Sí, actualizar' : 'Sí, guardar',
  })
  if (!ok) return
  saving.value = true
  clear()
  const body = { ...form, specifications: specsObject() }
  try {
    let res
    if (props.id) {
      delete body.product_id
      res = await TechnicalSheetService.update(props.id, body)
    } else {
      res = await TechnicalSheetService.store(body)
    }
    mark() // guardado: no preguntar al cerrar
    emit('saved', res.data.technical_sheet?.id ?? props.id)
  } catch (error) {
    handle(error)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <LoadingForm v-if="loading" variant="form" />
  <form v-else @submit.prevent="save">
    <ErrorSummary :message="message" :errors="errors" :attributes="attributes" />

    <CCard class="mb-4">
      <CCardHeader><strong>{{ id ? 'Editar ficha técnica' : 'Nueva ficha técnica' }}</strong></CCardHeader>
      <CCardBody>
        <FormField label="Producto" required :error="get('product_id')">
          <CFormInput v-if="id" :model-value="`${sheet?.product?.code} · ${sheet?.product?.name}`" disabled />
          <ComboSelect
            v-else
            v-model="form.product_id"
            :options="products.map((p) => ({ value: p.id, label: `${p.code} · ${p.name}` }))"
            placeholder="Escribe o selecciona un producto sin ficha..."
            :invalid="!!get('product_id')"
          />
        </FormField>
        <CRow>
          <CCol md="4">
            <FormField label="Marca" required :error="get('trademark_id')">
              <ComboSelect v-model="form.trademark_id" :options="options.trademarks.map((t) => ({ value: t.id, label: t.name }))" :invalid="!!get('trademark_id')" />
            </FormField>
          </CCol>
          <CCol md="4">
            <FormField label="Categoría" required :error="get('category_id')">
              <ComboSelect v-model="form.category_id" :options="options.categories.map((c) => ({ value: c.id, label: c.name }))" :invalid="!!get('category_id')" @change="form.subcategory_id = ''" />
            </FormField>
          </CCol>
          <CCol md="4">
            <FormField label="Subcategoría" required :error="get('subcategory_id')">
              <ComboSelect
                v-model="form.subcategory_id"
                :options="subcategories.map((s) => ({ value: s.id, label: s.name }))"
                :disabled="!form.category_id"
                :placeholder="form.category_id ? 'Escribe o selecciona...' : 'Primero elige una categoría'"
                :empty-text="form.category_id ? 'Esta categoría no tiene subcategorías asignadas' : 'Primero elige una categoría'"
                :invalid="!!get('subcategory_id')"
              />
            </FormField>
          </CCol>
        </CRow>
        <FormField label="Proceso" :error="get('process')">
          <CFormTextarea v-model="form.process" rows="2" :invalid="!!get('process')" />
        </FormField>
        <FormField label="Descripción" :error="get('description')">
          <CFormTextarea v-model="form.description" rows="2" :invalid="!!get('description')" />
        </FormField>
        <FormField label="Observación" :error="get('observation')">
          <CFormTextarea v-model="form.observation" rows="2" :invalid="!!get('observation')" />
        </FormField>
      </CCardBody>
    </CCard>

    <CCard class="mb-4">
      <CCardHeader><strong>Especificaciones</strong></CCardHeader>
      <CCardBody>
        <p class="form-text mt-0 mb-2">Características del producto como pares "nombre: valor". Ej. Material: Cuero sintético · Suela: TR · Altura de tacón: 5 cm. Se imprimen en la ficha y las ve el proveedor.</p>
        <KeyValueEditor v-model="specs" />
        <div v-if="get('specifications')" class="invalid-feedback d-block">{{ get('specifications') }}</div>
      </CCardBody>
    </CCard>

    <RequiredNote />
    <div class="d-flex justify-content-end gap-2 mt-3">
      <CButton color="secondary" variant="outline" @click="confirmLeave().then((ok) => ok && emit('cancel'))">Cancelar</CButton>
      <CButton type="submit" color="primary" :disabled="saving"><CSpinner v-if="saving" size="sm" /><CIcon v-else :icon="cilSave" /> Guardar</CButton>
    </div>
  </form>
</template>
