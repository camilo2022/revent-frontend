<script setup>
import { cilArrowLeft, cilBan, cilPencil, cilTask } from '@coreui/icons'
import { computed, onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import RequisitionService from '@/services/RequisitionService'
import { useAuthStore } from '@/stores/authStore'
import { usePermissions } from '@/composables/usePermissions'
import { useServerErrors } from '@/composables/useServerErrors'
import { confirmAction, notifyError } from '@/utils/swal'
import { errorMessage } from '@/utils/format'
import Button from '@/components/UI/templates/Button.vue'
import FormField from '@/components/UI/templates/FormField.vue'
import LoadingForm from '@/components/UI/templates/Skeleton.vue'
import StatusBadge from '@/components/UI/templates/StatusBadge.vue'
import { STATUSES } from './configuration.vue'

// Detalle de una solicitud: sus respuestas (con los campos con que se llenó) y, para quien gestiona, el cambio de estado
const props = defineProps({ id: { type: [String, Number], required: true } })
const emit = defineEmits(['edit', 'back'])
const auth = useAuthStore()
const { can } = usePermissions()
const { get, clear, handle } = useServerErrors()

const loading = ref(true)
const busy = ref(false)
const requisition = ref(null)
const nextStatus = ref('')
const statusObservation = ref('')

const load = async () => {
  try {
    requisition.value = (await RequisitionService.find(props.id)).data.requisition
  } catch (error) {
    notifyError(errorMessage(error))
    emit('back')
  } finally {
    loading.value = false
  }
}
onMounted(load)

const mine = computed(() => requisition.value?.user_created?.id === auth.user?.id)
const editable = computed(() => mine.value && requisition.value?.status === STATUSES.PENDING && !requisition.value?.deleted_at)
// Quien la creó no la gestiona (igual que el backend)
const manageable = computed(() => can('requisitions.manage') && !mine.value && !requisition.value?.deleted_at && requisition.value?.next_statuses?.length)

// Respuestas agrupadas por sección
const sections = computed(() => {
  const groups = []
  ;(requisition.value?.fields ?? []).forEach((f) => {
    const name = f.section || 'Información de la solicitud'
    let group = groups.find((g) => g.name === name)
    if (!group) groups.push((group = { name, fields: [] }))
    group.fields.push(f)
  })
  return groups
})

const answer = (f) => {
  const v = requisition.value.data?.[f.field]
  if (f.type === 'boolean') return v ? 'Sí' : 'No'
  if (v === null || v === undefined || v === '' || (Array.isArray(v) && !v.length)) return '—'
  if (f.type === 'selectdinamic') return (Array.isArray(v) ? v : [v]).map((x) => x.name ?? `#${x.id}`).join(', ')
  if (Array.isArray(v)) return v.join(', ')
  if (f.type === 'date') return dayjs(v).format('DD/MM/YYYY')
  if (f.type === 'datetime') return dayjs(v).format('DD/MM/YYYY hh:mm A')
  if (f.type === 'number') return new Intl.NumberFormat('es-CO').format(v)
  return v
}

// Un texto que es un enlace se muestra como enlace
const isLink = (v) => typeof v === 'string' && /^https?:\/\/\S+$/.test(v)

const changeStatus = async () => {
  const label = nextStatus.value
  if (!(await confirmAction({ title: `¿Pasar la solicitud N° ${props.id} a «${label}»?`, text: statusObservation.value || 'Sin observación.', confirmText: 'Sí, cambiar' }))) return
  busy.value = true
  clear()
  try {
    requisition.value = (await RequisitionService.status(props.id, { status: nextStatus.value, status_observation: statusObservation.value || null })).data.requisition
    nextStatus.value = ''
    statusObservation.value = ''
  } catch (error) {
    handle(error)
  } finally {
    busy.value = false
  }
}

const cancelRequisition = async () => {
  if (!(await confirmAction({ title: `¿Anular la solicitud N° ${props.id}?`, text: 'Podrás reactivarla mientras siga pendiente.', confirmText: 'Sí, anular' }))) return
  busy.value = true
  try {
    await RequisitionService.delete(props.id)
    emit('back')
  } catch (error) {
    notifyError(errorMessage(error))
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <LoadingForm v-if="loading" variant="form" />
  <div v-else-if="requisition" class="d-flex flex-column gap-4 fade-in">
    <CCard>
      <CCardHeader class="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <strong>Solicitud N° {{ requisition.id }} · {{ requisition.request_type?.name }}</strong>
        <div class="d-flex gap-2">
          <CButton color="secondary" variant="outline" size="sm" @click="emit('back')"><CIcon :icon="cilArrowLeft" class="me-1" />Volver</CButton>
          <Button v-if="editable" size="sm" color="primary" variant="outline" permission="requisitions.update" :icon="cilPencil" @click="emit('edit')">Editar</Button>
          <Button v-if="editable" size="sm" color="danger" variant="outline" permission="requisitions.delete" :icon="cilBan" :loading="busy" @click="cancelRequisition">Anular</Button>
        </div>
      </CCardHeader>
      <CCardBody>
        <CRow class="g-3">
          <CCol md="3"><div class="small text-body-secondary">Estado</div><StatusBadge :status="requisition.status" /><CBadge v-if="requisition.deleted_at" color="secondary" class="ms-1">Anulada</CBadge></CCol>
          <CCol md="3"><div class="small text-body-secondary">Fecha</div>{{ dayjs(requisition.date).format('DD/MM/YYYY') }}</CCol>
          <CCol md="3"><div class="small text-body-secondary">Creada por</div>{{ requisition.user_created?.name ?? '-' }} <span v-if="requisition.user_created" class="small text-body-secondary">({{ requisition.user_created.username }})</span></CCol>
          <!-- Último que la actualizó (quien la gestiona al cambiar el estado) -->
          <CCol md="3"><div class="small text-body-secondary">Última actualización</div>{{ requisition.user_updated?.name ?? '-' }}<div class="small text-body-secondary">{{ dayjs(requisition.updated_at).format('DD/MM/YYYY hh:mm A') }}</div></CCol>
          <CCol v-if="requisition.observation" md="6"><div class="small text-body-secondary">Observación</div>{{ requisition.observation }}</CCol>
          <CCol v-if="requisition.status_observation" md="6"><div class="small text-body-secondary">Observación de gestión</div>{{ requisition.status_observation }}</CCol>
        </CRow>
      </CCardBody>
    </CCard>

    <CCard v-if="manageable">
      <CCardHeader><strong>Gestionar</strong></CCardHeader>
      <CCardBody>
        <CRow>
          <CCol md="4">
            <FormField label="Pasar a" required :error="get('status')">
              <CFormSelect v-model="nextStatus">
                <option value="">Selecciona...</option>
                <option v-for="s in requisition.next_statuses" :key="s" :value="s">{{ s }}</option>
              </CFormSelect>
            </FormField>
          </CCol>
          <CCol md="8">
            <FormField label="Observación de gestión" :required="nextStatus === STATUSES.REJECTED" :error="get('status_observation')" hint="Obligatoria al rechazar.">
              <CFormInput v-model="statusObservation" maxlength="1000" />
            </FormField>
          </CCol>
        </CRow>
        <Button :loading="busy" :disabled="!nextStatus" permission="requisitions.manage" :icon="cilTask" @click="changeStatus">Cambiar estado</Button>
      </CCardBody>
    </CCard>

    <CCard v-for="s in sections" :key="s.name">
      <CCardHeader><strong>{{ s.name }}</strong></CCardHeader>
      <CCardBody>
        <CRow class="g-3">
          <CCol v-for="f in s.fields" :key="f.field" :md="['textarea', 'file'].includes(f.type) || f.cardinality === 'multiple' ? 12 : 6">
            <div class="small text-body-secondary">{{ f.label }}</div>
            <ul v-if="f.type === 'file' && (requisition.data?.[f.field] ?? []).length" class="list-unstyled mb-0">
              <li v-for="file in requisition.data[f.field]" :key="file.path"><a :href="file.url" target="_blank" rel="noopener">{{ file.name }}</a></li>
            </ul>
            <a v-else-if="isLink(requisition.data?.[f.field])" :href="requisition.data[f.field]" target="_blank" rel="noopener">{{ requisition.data[f.field] }}</a>
            <div v-else style="white-space: pre-line">{{ answer(f) }}</div>
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>
  </div>
</template>
