<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { productService } from '@/services/product.service'
import { useOptions } from '@/composables/useOptions'
import { useServerErrors } from '@/composables/useServerErrors'
import { notify } from '@/utils/swal'
import FormField from '@/components/FormField.vue'
import LoadingForm from '@/components/LoadingForm.vue'
import ErrorSummary from '@/components/ErrorSummary.vue'
import RequiredNote from '@/components/RequiredNote.vue'
import ColorSizeEditor from '@/components/ColorSizeEditor.vue'

// Formulario compartido de crear (sin id) y editar (con id)
const props = defineProps({ id: [String, Number] })
const router = useRouter()
const { options, loadOptions } = useOptions()
const { errors, message, get, clear, handle } = useServerErrors()

const loading = ref(true)
const saving = ref(false)
const product = ref(null)
const form = reactive({ collection_id: '', name: '', description: '', price: null, cost: null })
const colors = ref([])

// Vista previa del código: lo genera el servidor al guardar
const nextCode = computed(() => options.collections.find((c) => c.id === Number(form.collection_id))?.next_code)

onMounted(async () => {
  await loadOptions(['collections', 'colors', 'sizes'])
  if (props.id) {
    try {
      const res = await productService.find(props.id)
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
})

const save = async () => {
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
    const res = props.id ? await productService.update(props.id, body) : await productService.store(body)
    notify('Producto guardado')
    router.push(`/products/${res.data.product?.id ?? props.id}`)
  } catch (error) {
    handle(error)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <LoadingForm v-if="loading" />
  <form v-else @submit.prevent="save">
    <ErrorSummary :message="message" :errors="errors" />

    <CCard class="mb-4">
      <CCardHeader><strong>{{ id ? `Editar producto ${product?.code ?? ''}` : 'Nuevo producto' }}</strong></CCardHeader>
      <CCardBody>
        <CRow>
          <CCol md="4">
            <FormField label="Colección" required :error="get('collection_id')">
              <CFormSelect v-model="form.collection_id" :disabled="!!id" :invalid="!!get('collection_id')">
                <option value="">Selecciona...</option>
                <option v-for="c in options.collections" :key="c.id" :value="c.id">{{ c.name }} ({{ c.product_prefix }})</option>
              </CFormSelect>
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
        <ColorSizeEditor v-model="colors" :colors="options.colors" :sizes="options.sizes" />
      </CCardBody>
    </CCard>

    <RequiredNote />
    <div class="d-flex justify-content-end gap-2 mt-3">
      <RouterLink to="/products"><CButton color="secondary" variant="outline">Cancelar</CButton></RouterLink>
      <CButton type="submit" color="primary" :disabled="saving"><CSpinner v-if="saving" size="sm" /> Guardar</CButton>
    </div>
  </form>
</template>
