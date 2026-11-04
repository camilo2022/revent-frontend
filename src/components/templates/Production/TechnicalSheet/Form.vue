<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import TechnicalSheetService from '@/services/TechnicalSheetService'
import ProductService from '@/services/ProductService'
import { useOptions } from '@/composables/useOptions'
import { useServerErrors } from '@/composables/useServerErrors'
import FormField from '@/components/UI/templates/FormField.vue'
import LoadingForm from '@/components/UI/templates/Skeleton.vue'
import ErrorSummary from '@/components/UI/templates/ErrorSummary.vue'
import RequiredNote from '@/components/UI/templates/RequiredNote.vue'
import KeyValueEditor from '@/components/UI/templates/KeyValueEditor.vue'

// Formulario compartido de crear (sin id) y editar (con id)
const props = defineProps({ id: [String, Number] })
const emit = defineEmits(['saved', 'cancel'])
const { options, loadOptions } = useOptions()
const { errors, message, get, clear, handle } = useServerErrors()

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

// Si la categoría trae sus subcategorías se usan; si no, todas
const subcategories = computed(() => {
  const category = options.categories.find((c) => c.id === Number(form.category_id))
  return category?.subcategories?.length ? category.subcategories : options.subcategories
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
    }
  } catch (error) {
    handle(error)
  }
  loading.value = false
})

// Pares clave/valor => objeto { clave: valor }
const specsObject = () =>
  Object.fromEntries(specs.value.filter((r) => r.key.trim()).map((r) => [r.key.trim(), r.value]))

const save = async () => {
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
    <ErrorSummary :message="message" :errors="errors" />

    <CCard class="mb-4">
      <CCardHeader><strong>{{ id ? 'Editar ficha técnica' : 'Nueva ficha técnica' }}</strong></CCardHeader>
      <CCardBody>
        <FormField label="Producto" required :error="get('product_id')">
          <CFormInput v-if="id" :model-value="`${sheet?.product?.code} · ${sheet?.product?.name}`" disabled />
          <CFormSelect v-else v-model="form.product_id" :invalid="!!get('product_id')">
            <option value="">Selecciona un producto sin ficha...</option>
            <option v-for="p in products" :key="p.id" :value="p.id">{{ p.code }} · {{ p.name }}</option>
          </CFormSelect>
        </FormField>
        <CRow>
          <CCol md="4">
            <FormField label="Marca" required :error="get('trademark_id')">
              <CFormSelect v-model="form.trademark_id" :invalid="!!get('trademark_id')">
                <option value="">Selecciona...</option>
                <option v-for="t in options.trademarks" :key="t.id" :value="t.id">{{ t.name }}</option>
              </CFormSelect>
            </FormField>
          </CCol>
          <CCol md="4">
            <FormField label="Categoría" required :error="get('category_id')">
              <CFormSelect v-model="form.category_id" :invalid="!!get('category_id')" @change="form.subcategory_id = ''">
                <option value="">Selecciona...</option>
                <option v-for="c in options.categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </CFormSelect>
            </FormField>
          </CCol>
          <CCol md="4">
            <FormField label="Subcategoría" required :error="get('subcategory_id')">
              <CFormSelect v-model="form.subcategory_id" :invalid="!!get('subcategory_id')">
                <option value="">Selecciona...</option>
                <option v-for="s in subcategories" :key="s.id" :value="s.id">{{ s.name }}</option>
              </CFormSelect>
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
        <KeyValueEditor v-model="specs" />
        <div v-if="get('specifications')" class="invalid-feedback d-block">{{ get('specifications') }}</div>
      </CCardBody>
    </CCard>

    <RequiredNote />
    <div class="d-flex justify-content-end gap-2 mt-3">
      <CButton color="secondary" variant="outline" @click="emit('cancel')">Cancelar</CButton>
      <CButton type="submit" color="primary" :disabled="saving"><CSpinner v-if="saving" size="sm" /> Guardar</CButton>
    </div>
  </form>
</template>
