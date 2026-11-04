<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { cilPencil } from '@coreui/icons'
import Swal from 'sweetalert2'
import { technicalSheetService } from '@/services/technicalSheet.service'
import { usePermissions } from '@/composables/usePermissions'
import { confirmAction, notify } from '@/utils/swal'
import { date, errorMessage } from '@/utils/format'
import LoadingForm from '@/components/LoadingForm.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import ProductColors from '@/components/ProductColors.vue'

const props = defineProps({ id: String })
const router = useRouter()
const { can } = usePermissions()
const sheet = ref(null)
const busy = ref(false)

const load = async () => {
  sheet.value = null
  try {
    sheet.value = (await technicalSheetService.find(props.id)).data.technical_sheet
  } catch (error) {
    Swal.fire({ icon: 'error', title: 'No se pudo cargar', text: errorMessage(error) })
  }
}
onMounted(load)
watch(() => props.id, load)

const specs = computed(() => Object.entries(sheet.value?.specifications ?? {}))
const status = computed(() => sheet.value?.status)

// Acciones disponibles según el estado y el permiso
const actions = computed(() => {
  const list = [
    { key: 'reviewed', label: 'Enviar a revisión', color: 'info', permission: 'technical_sheets.reviewed', when: ['Pendiente'], text: 'La ficha pasará a revisión.' },
    { key: 'approved', label: 'Aprobar', color: 'success', permission: 'technical_sheets.approved', when: ['Pendiente', 'En revision'], text: 'Una ficha aprobada ya no se puede editar.' },
    { key: 'canceled', label: 'Cancelar', color: 'danger', permission: 'technical_sheets.canceled', when: ['Pendiente', 'En revision', 'Aprobado'], text: 'La ficha quedará cancelada.' },
    { key: 'version', label: 'Nueva versión', color: 'primary', permission: 'technical_sheets.version', when: ['Aprobado', 'Cancelado'], text: 'Se creará una nueva versión en estado Pendiente copiando esta ficha.' },
  ]
  return list.filter((a) => a.when.includes(status.value) && can(a.permission))
})

const run = async (action) => {
  if (!(await confirmAction({ title: `¿${action.label}?`, text: action.text, confirmText: 'Sí, continuar' }))) return
  busy.value = true
  try {
    const res = await technicalSheetService[action.key](sheet.value.id)
    notify('Acción realizada')
    if (action.key === 'version') router.push(`/technical_sheets/${res.data.technical_sheet.id}`)
    else await load()
  } catch (error) {
    Swal.fire({ icon: 'error', title: 'No se pudo completar', text: errorMessage(error) })
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <LoadingForm v-if="!sheet" />
  <template v-else>
    <CCard class="mb-4">
      <CCardHeader class="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <strong>
          Ficha técnica {{ sheet.product?.code }} · {{ sheet.product?.name }} (v{{ sheet.version }})
          <StatusBadge :status="sheet.status" class="ms-2" />
        </strong>
        <div class="d-flex gap-2">
          <RouterLink v-if="can('technical_sheets.update') && ['Pendiente', 'En revision'].includes(status)" :to="`/technical_sheets/${sheet.id}/edit`">
            <CButton color="primary" variant="outline" size="sm"><CIcon :icon="cilPencil" /> Editar</CButton>
          </RouterLink>
          <CButton v-for="a in actions" :key="a.key" :color="a.color" size="sm" :disabled="busy" @click="run(a)">{{ a.label }}</CButton>
        </div>
      </CCardHeader>
      <CCardBody>
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
