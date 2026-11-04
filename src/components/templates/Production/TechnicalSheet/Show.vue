<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { cilHistory, cilIndustry, cilPencil } from '@coreui/icons'
import TechnicalSheetService from '@/services/TechnicalSheetService'
import { usePermissions } from '@/composables/usePermissions'
import { confirmAction, notify, notifyError } from '@/utils/swal'
import { date, errorMessage } from '@/utils/format'
import LoadingForm from '@/components/UI/templates/Skeleton.vue'
import StatusBadge from '@/components/UI/templates/StatusBadge.vue'
import ProductColors from '../Product/ProductColors.vue'

const props = defineProps({ id: [String, Number] })
const emit = defineEmits(['edit', 'back'])
const router = useRouter()
const { can } = usePermissions()
const sheet = ref(null)
const busy = ref(false)

const load = async () => {
  sheet.value = null
  try {
    sheet.value = (await TechnicalSheetService.find(props.id)).data.technical_sheet
  } catch (error) {
    notifyError(errorMessage(error))
  }
}
onMounted(load)
watch(() => props.id, load)

const specs = computed(() => Object.entries(sheet.value?.specifications ?? {}))
const status = computed(() => sheet.value?.status)

// Acciones disponibles según el estado y el permiso
const actions = computed(() => {
  const list = [
    { key: 'reviewed', label: 'Enviar a revisión', color: 'info', permission: 'technical_sheets.reviewed', when: ['Pendiente', 'Cancelado'], text: 'La ficha pasará a revisión (también reactiva una ficha cancelada).' },
    { key: 'approved', label: 'Aprobar', color: 'success', permission: 'technical_sheets.approved', when: ['Pendiente', 'En revision'], text: 'El producto debe tener al menos un color con tallas.' },
    { key: 'canceled', label: 'Cancelar', color: 'danger', permission: 'technical_sheets.canceled', when: ['Pendiente', 'En revision', 'Aprobado'], text: 'La ficha quedará cancelada.' },
  ]
  return list.filter((a) => a.when.includes(status.value) && can(a.permission))
})

const run = async (action) => {
  if (!(await confirmAction({ title: `¿${action.label}?`, text: action.text, confirmText: 'Sí, continuar' }))) return
  busy.value = true
  try {
    await TechnicalSheetService[action.key](sheet.value.id)
    notify('Acción realizada')
    await load()
  } catch (error) {
    notifyError(errorMessage(error))
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <LoadingForm v-if="!sheet" variant="form" />
  <template v-else>
    <CCard class="mb-4">
      <CCardHeader class="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <strong>
          Ficha técnica {{ sheet.product?.code }} · {{ sheet.product?.name }}
          <StatusBadge :status="sheet.status" class="ms-2" />
        </strong>
        <div class="d-flex gap-2">
          <CButton color="secondary" variant="outline" size="sm" @click="emit('back')">Volver</CButton>
          <CButton v-if="can('technical_sheets.update') && status !== 'Cancelado'" color="primary" variant="outline" size="sm" @click="emit('edit')"><CIcon :icon="cilPencil" /> Editar</CButton>
          <CButton v-if="can('audits.all')" color="secondary" variant="outline" size="sm" @click="router.push('/audits')"><CIcon :icon="cilHistory" /> Ver historial de cambios</CButton>
          <CButton v-if="status === 'Aprobado' && can('production_orders.store')" color="success" size="sm" title="Abre una orden nueva con esta ficha ya elegida" @click="router.push({ path: '/production_orders', query: { panel: 'create', technical_sheet_id: sheet.id } })">
            <CIcon :icon="cilIndustry" /> Crear orden de producción con esta ficha
          </CButton>
          <CButton v-for="a in actions" :key="a.key" :color="a.color" size="sm" :disabled="busy" @click="run(a)">{{ a.label }}</CButton>
        </div>
      </CCardHeader>
      <CCardBody>
        <CAlert v-if="status === 'Aprobado'" color="info" class="py-2">Los cambios quedan registrados en la auditoría.</CAlert>
        <CRow class="mb-3">
          <CCol md="3"><small class="text-body-secondary d-block">Marca</small>{{ sheet.trademark?.name ?? '-' }}</CCol>
          <CCol md="3"><small class="text-body-secondary d-block">Categoría</small>{{ sheet.category?.name ?? '-' }}</CCol>
          <CCol md="3"><small class="text-body-secondary d-block">Subcategoría</small>{{ sheet.subcategory?.name ?? '-' }}</CCol>
          <CCol md="3"><small class="text-body-secondary d-block">Aprobada</small>{{ sheet.approved_at ? date(sheet.approved_at) : '-' }}</CCol>
        </CRow>
        <div class="mb-3"><small class="text-body-secondary d-block">Proceso</small><span class="spec-pre">{{ sheet.process || '-' }}</span></div>
        <div class="mb-3"><small class="text-body-secondary d-block">Descripción</small><span class="spec-pre">{{ sheet.description || '-' }}</span></div>
        <div><small class="text-body-secondary d-block">Observación</small><span class="spec-pre">{{ sheet.observation || '-' }}</span></div>
      </CCardBody>
    </CCard>

    <CCard class="mb-4">
      <CCardHeader><strong>Especificaciones</strong></CCardHeader>
      <CCardBody>
        <p v-if="!specs.length" class="text-body-secondary mb-0">Sin especificaciones.</p>
        <CTable v-else small class="mb-0">
          <CTableBody>
            <CTableRow v-for="[key, value] in specs" :key="key">
              <CTableHeaderCell style="width: 30%">{{ key }}</CTableHeaderCell>
              <CTableDataCell>{{ value }}</CTableDataCell>
            </CTableRow>
          </CTableBody>
        </CTable>
      </CCardBody>
    </CCard>

    <CCard>
      <CCardHeader><strong>Producto: colores y tallas</strong></CCardHeader>
      <CCardBody><ProductColors :colors="sheet.product?.colors" /></CCardBody>
    </CCard>
  </template>
</template>
