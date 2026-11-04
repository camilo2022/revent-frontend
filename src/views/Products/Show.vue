<script setup>
import { onMounted, ref } from 'vue'
import { cilPencil } from '@coreui/icons'
import { productService } from '@/services/product.service'
import { usePermissions } from '@/composables/usePermissions'
import { useServerErrors } from '@/composables/useServerErrors'
import { money } from '@/utils/format'
import LoadingForm from '@/components/LoadingForm.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import ProductColors from '@/components/ProductColors.vue'

const props = defineProps({ id: String })
const { can } = usePermissions()
const { handle } = useServerErrors()
const product = ref(null)

onMounted(async () => {
  try {
    product.value = (await productService.find(props.id)).data.product
  } catch (error) {
    handle(error)
  }
})
</script>

<template>
  <LoadingForm v-if="!product" />
  <template v-else>
    <CCard class="mb-4">
      <CCardHeader class="d-flex justify-content-between align-items-center">
        <strong>{{ product.code }} · {{ product.name }}</strong>
        <RouterLink v-if="can('products.update')" :to="`/products/${product.id}/edit`">
          <CButton color="primary" size="sm"><CIcon :icon="cilPencil" /> Editar</CButton>
        </RouterLink>
      </CCardHeader>
      <CCardBody>
        <CRow>
          <CCol md="3"><small class="text-body-secondary d-block">Colección</small>{{ product.collection?.name ?? '-' }}</CCol>
          <CCol md="3"><small class="text-body-secondary d-block">Costo</small>{{ money(product.cost) }}</CCol>
          <CCol md="3"><small class="text-body-secondary d-block">Precio</small>{{ money(product.price) }}</CCol>
          <CCol md="3">
            <small class="text-body-secondary d-block">Ficha técnica</small>
            <template v-if="product.technical_sheet">
              <RouterLink :to="`/technical_sheets/${product.technical_sheet.id}`">v{{ product.technical_sheet.version }}</RouterLink>
              <StatusBadge :status="product.technical_sheet.status" class="ms-1" />
            </template>
            <template v-else>Sin ficha</template>
          </CCol>
        </CRow>
        <p v-if="product.description" class="mt-3 mb-0">{{ product.description }}</p>
      </CCardBody>
    </CCard>

    <CCard>
      <CCardHeader><strong>Colores y tallas</strong></CCardHeader>
      <CCardBody><ProductColors :colors="product.colors" /></CCardBody>
    </CCard>
  </template>
</template>
