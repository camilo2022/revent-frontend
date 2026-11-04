<script setup>
import ComboSelect from '@/components/UI/templates/ComboSelect.vue'
import { cilSave } from '@coreui/icons'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import ProductService from '@/services/ProductService'
import { useOptions } from '@/composables/useOptions'
import { useServerErrors } from '@/composables/useServerErrors'
import { usePermissions } from '@/composables/usePermissions'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import { confirmAction, notify } from '@/utils/swal'
import FormField from '@/components/UI/templates/FormField.vue'
import LoadingForm from '@/components/UI/templates/Skeleton.vue'
import ErrorSummary from '@/components/UI/templates/ErrorSummary.vue'
import RequiredNote from '@/components/UI/templates/RequiredNote.vue'
import ColorSizeEditor from './ColorSizeEditor.vue'

// Formulario compartido de crear (sin id) y editar (con id)
const props = defineProps({ id: [String, Number] })
const emit = defineEmits(['saved', 'cancel'])
const { options, loadOptions } = useOptions()
const { errors, message, attributes, get, clear, handle } = useServerErrors()
const { can } = usePermissions()
const router = useRouter()

const loading = ref(true)
const saving = ref(false)
const product = ref(null)
const form = reactive({ collection_id: '', name: '', description: '', price: null, cost: null })
const colors = ref([])
// Aviso de cambios sin guardar (campos + colores y tallas)
const { mark, confirmLeave } = useUnsavedChanges(() => JSON.stringify({ form, colors: colors.value }))

// Vista previa del código: lo genera el servidor al guardar
const nextCode = computed(() => options.collections.find((c) => c.id === Number(form.collection_id))?.next_code)

onMounted(async () => {
  await loadOptions(['collections', 'colors', 'sizes'])
  if (props.id) {
    try {
      const res = await ProductService.find(props.id)
      product.value = res.data.product
      Object.assign(form, {
        collection_id: product.value.collection_id,
        name: product.value.name,
        description: product.value.description ?? '',
        price: product.value.price,
        cost: product.value.cost,
      })
      colors.value = product.value.colors.map((c) => ({
        color_id: c.color.id,
        description: c.description,
        size_ids: c.sizes.map((s) => s.size.id),
      }))
    } catch (error) {
      handle(error)
    }
  }
  loading.value = false
  mark()
})

const save = async () => {
  const editing = !!props.id
  const ok = await confirmAction({
    title: editing ? '¿Desea actualizar el producto?' : '¿Desea guardar el producto?',
    text: editing ? 'Se actualizarán los datos.' : 'Se creará el registro.',
    confirmText: editing ? 'Sí, actualizar' : 'Sí, guardar',
  })
  if (!ok) return
  saving.value = true
  clear()
  const body = {
    name: form.name.toUpperCase(),
    description: form.description || null,
    price: form.price === '' || form.price === null ? null : Number(form.price),
    cost: form.cost === '' || form.cost === null ? null : Number(form.cost),
    colors_id: colors.value.map((c) => ({
      color_id: c.color_id,
      description: c.description,
      sizes_id: c.size_ids.map((id) => ({ size_id: id, description: null })),
    })),
  }
  if (!props.id) body.collection_id = form.collection_id
  try {
    const res = props.id ? await ProductService.update(props.id, body) : await ProductService.store(body)
    const saved = res.data?.product
    mark() // guardado: no preguntar al cerrar
    emit('saved', saved?.id ?? props.id)
    // Siguiente paso: la ficha técnica (solo al crear y si tiene permiso)
    if (!props.id && saved?.id && can('technical_sheets.store')) {
      const go = await confirmAction({
        title: 'Producto creado',
        text: '¿Quieres crear ahora la ficha técnica de este producto? Es el siguiente paso antes de la orden de producción.',
        confirmText: 'Sí, crear la ficha técnica',
        icon: 'success',
      })
      if (go) router.push({ path: '/technical_sheets', query: { panel: 'create', product_id: saved.id } })
    }
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
      <CCardHeader><strong>{{ id ? `Editar producto ${product?.code ?? ''}` : 'Nuevo producto' }}</strong></CCardHeader>
      <CCardBody>
        <CRow>
          <CCol md="4">
            <FormField label="Colección" required :error="get('collection_id')">
              <ComboSelect v-model="form.collection_id" :options="options.collections.map((c) => ({ value: c.id, label: `${c.name} (${c.product_prefix})` }))" :disabled="!!id" :invalid="!!get('collection_id')" />
              <div v-if="!id && nextCode" class="form-text">Código estimado: <strong>{{ nextCode }}</strong> (se asigna al guardar)</div>
            </FormField>
          </CCol>
          <CCol md="8">
            <FormField label="Nombre" required :error="get('name')">
              <CFormInput v-model="form.name" :invalid="!!get('name')" />
            </FormField>
          </CCol>
        </CRow>
        <FormField label="Descripción" :error="get('description')">
          <CFormTextarea v-model="form.description" rows="2" />
        </FormField>
        <CRow>
          <CCol md="6">
            <FormField label="Costo" :error="get('cost')">
              <CFormInput v-model="form.cost" type="number" min="0" :invalid="!!get('cost')" />
            </FormField>
          </CCol>
          <CCol md="6">
            <FormField label="Precio" required :error="get('price')">
              <CFormInput v-model="form.price" type="number" min="0" :invalid="!!get('price')" />
            </FormField>
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>

    <CCard class="mb-4">
      <CCardHeader><strong>Colores y tallas</strong><span class="text-danger" aria-label="obligatorio"> *</span></CCardHeader>
      <CCardBody>
        <ColorSizeEditor v-model="colors" :colors="options.colors" :sizes="options.sizes" :product-code="product?.code ?? ''" />
      </CCardBody>
    </CCard>

    <RequiredNote />
    <div class="d-flex justify-content-end gap-2 mt-3">
      <CButton color="secondary" variant="outline" @click="confirmLeave().then((ok) => ok && emit('cancel'))">Cancelar</CButton>
      <CButton type="submit" color="primary" :disabled="saving"><CSpinner v-if="saving" size="sm" /><CIcon v-else :icon="cilSave" /> Guardar</CButton>
    </div>
  </form>
</template>
