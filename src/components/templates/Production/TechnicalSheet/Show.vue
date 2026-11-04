<script setup>
import { cilSend, cilCheckAlt, cilBan } from '@coreui/icons'
import { cilArrowLeft } from '@coreui/icons'
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
import AuditTimeline from '@/components/UI/templates/AuditTimeline.vue'

const props = defineProps({ id: [String, Number] })
const emit = defineEmits(['edit', 'back'])
const router = useRouter()
const { can } = usePermissions()
const sheet = ref(null)
const busy = ref(false)
const auditOpen = ref(false)

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
const actionIcons = { reviewed: cilSend, approved: cilCheckAlt, canceled: cilBan }
const actions = computed(() => {
  const list = [
    { key: 'reviewed', label: status.value === 'Cancelado' ? 'Reactivar (enviar a revisión)' : 'Enviar a revisión', color: 'warning', permission: 'technical_sheets.reviewed', when: ['Pendiente', 'Cancelado'], text: 'La ficha pasará a revisión (también reactiva una ficha cancelada).' },
    { key: 'approved', label: 'Aprobar ficha', color: 'success', permission: 'technical_sheets.approved', when: ['Pendiente', 'En revision'], text: 'El producto debe tener al menos un color con tallas.' },
    { key: 'canceled', label: 'Cancelar ficha', color: 'danger', permission: 'technical_sheets.canceled', when: ['Pendiente', 'En revision', 'Aprobado'], text: 'La ficha quedará cancelada.' },
  ]
  // Sin permiso la acción se ve desactivada (existe, pero no está permitida)
  return list.filter((a) => a.when.includes(status.value)).map((a) => ({ ...a, allowed: can(a.permission) }))
})

// Pasos del proceso de la ficha
const steps = [
  { key: 'Pendiente', label: 'Pendiente' },
  { key: 'En revision', label: 'En revisión' },
  { key: 'Aprobado', label: 'Aprobado' },
]
const stepIndex = computed(() => steps.findIndex((x) => x.key === status.value))

const run = async (action) => {
  if (!(await confirmAction({ title: `¿${action.label}?`, text: action.text, confirmText: 'Sí, continuar' }))) return
  busy.value = true
  try {
    await TechnicalSheetService[action.key](sheet.value.id)
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
    <AuditTimeline v-if="auditOpen" base="/technical_sheets" :id="sheet.id" :title="`${sheet.product?.code} · ${sheet.product?.name}`" @close="auditOpen = false" />
    <CCard class="mb-4">
      <CCardHeader class="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <strong>
          Ficha técnica {{ sheet.product?.code }} · {{ sheet.product?.name }}
          <StatusBadge :status="sheet.status" class="ms-2" />
        </strong>
        <div class="d-flex gap-2">
          <CButton color="secondary" variant="outline" size="sm" @click="emit('back')"><CIcon :icon="cilArrowLeft" /> Volver</CButton>
          <CButton v-if="can('technical_sheets.update') && status !== 'Cancelado'" color="primary" variant="outline" size="sm" @click="emit('edit')"><CIcon :icon="cilPencil" /> Editar</CButton>
          <CButton :disabled="!can('audits.find')" color="secondary" variant="outline" size="sm" :title="can('audits.find') ? 'Auditoría del registro' : 'No tienes permiso para esta acción'" @click="auditOpen = true"><CIcon :icon="cilHistory" /> Auditoría</CButton>
          <CButton v-if="status === 'Aprobado' && can('production_orders.store')" color="success" size="sm" title="Abre una orden nueva con esta ficha ya elegida" @click="router.push({ path: '/production_orders', query: { panel: 'create', technical_sheet_id: sheet.id } })">
            <CIcon :icon="cilIndustry" /> Crear orden de producción con esta ficha
          </CButton>
        </div>
      </CCardHeader>
      <CCardBody>
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 border rounded p-3 mb-3 bg-body-tertiary">
          <div class="d-flex flex-wrap align-items-center gap-2">
            <span v-if="status === 'Cancelado'" class="badge text-bg-danger d-inline-flex align-items-center gap-1 px-3 py-2"><CIcon :icon="cilBan" /> Cancelada</span>
            <template v-else>
              <template v-for="(step, i) in steps" :key="step.key">
                <span
                  class="badge d-inline-flex align-items-center gap-1 px-3 py-2"
                  :class="i < stepIndex ? 'text-bg-success' : i === stepIndex ? 'text-bg-primary' : 'text-bg-light border text-body-secondary'"
                >
                  <CIcon v-if="i < stepIndex" :icon="cilCheckAlt" size="sm" /> {{ step.label }}
                </span>
                <span v-if="i < steps.length - 1" class="text-body-secondary">&rsaquo;</span>
              </template>
            </template>
          </div>
          <div class="d-flex flex-wrap gap-2">
            <CButton
              v-for="a in actions"
              :key="a.key"
              :color="a.color"
              :variant="a.key === 'canceled' ? 'outline' : undefined"
              :disabled="busy || !a.allowed"
              :title="a.allowed ? a.text : 'No tienes permiso para esta acción'"
              @click="run(a)"
            >
              <CSpinner v-if="busy" size="sm" class="me-1" /><CIcon v-else :icon="actionIcons[a.key]" class="me-1" />{{ a.label }}
            </CButton>
          </div>
        </div>
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
