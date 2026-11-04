<script setup>
import { cilHistory } from '@coreui/icons'
import AuditTimeline from '@/components/UI/templates/AuditTimeline.vue'
import { cilArrowLeft } from '@coreui/icons'
import { onMounted, ref } from 'vue'
import { cilPencil } from '@coreui/icons'
import ProductService from '@/services/ProductService'
import { usePermissions } from '@/composables/usePermissions'
import { useServerErrors } from '@/composables/useServerErrors'
import { money } from '@/utils/format'
import LoadingForm from '@/components/UI/templates/Skeleton.vue'
import StatusBadge from '@/components/UI/templates/StatusBadge.vue'
import ProductColors from './ProductColors.vue'

const props = defineProps({ id: [String, Number] })
const { can } = usePermissions()
const auditOpen = ref(false)
const emit = defineEmits(['edit', 'back'])
const { handle } = useServerErrors()
const product = ref(null)

onMounted(async () => {
  try {
    product.value = (await ProductService.find(props.id)).data.product
  } catch (error) {
    handle(error)
  }
})
</script>

<template>
  <LoadingForm v-if="!product" variant="form" />
  <template v-else>
    <AuditTimeline v-if="auditOpen" base="/products" :id="product.id" :title="`${product.code} · ${product.name}`" @close="auditOpen = false" />
    <CCard class="mb-4">
      <CCardHeader class="d-flex justify-content-between align-items-center">
        <strong>{{ product.code }} · {{ product.name }}</strong>
        <div class="d-flex gap-2">
          <CButton color="secondary" variant="outline" size="sm" @click="emit('back')"><CIcon :icon="cilArrowLeft" /> Volver</CButton>
          <CButton v-if="can('products.update')" color="primary" variant="outline" size="sm" @click="emit('edit')"><CIcon :icon="cilPencil" /> Editar</CButton>
          <CButton :disabled="!can('audits.find')" color="secondary" variant="outline" size="sm" :title="can('audits.find') ? 'Auditoría del registro' : 'No tienes permiso para esta acción'" @click="auditOpen = true"><CIcon :icon="cilHistory" /> Auditoría</CButton>
        </div>
      </CCardHeader>
      <CCardBody>
        <CRow>
          <CCol md="3"><small class="text-body-secondary d-block">Colección</small>{{ product.collection?.name ?? '-' }}</CCol>
          <CCol md="3"><small class="text-body-secondary d-block">Costo</small>{{ money(product.cost) }}</CCol>
          <CCol md="3"><small class="text-body-secondary d-block">Precio</small>{{ money(product.price) }}</CCol>
          <CCol md="3">
            <small class="text-body-secondary d-block">Ficha técnica</small>
            <template v-if="product.technical_sheet">
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
