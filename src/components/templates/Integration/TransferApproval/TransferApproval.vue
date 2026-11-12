<script setup>
import { computed, ref } from 'vue'
import { cilCheckAlt, cilReload, cilSearch } from '@coreui/icons'
import TransferApprovalService from '@/services/integration/TransferApprovalService'
import { useServerErrors } from '@/composables/useServerErrors'
import { useSiigoCredentials } from '@/composables/useSiigoCredentials'
import { useAlertStore } from '@/stores/alertStore'
import { confirmAction } from '@/utils/swal'
import Button from '@/components/UI/templates/Button.vue'
import FormField from '@/components/UI/templates/FormField.vue'
import JobQueuedNotice from '@/components/UI/templates/JobQueuedNotice.vue'
import SiigoCredentialNotice from '@/components/UI/templates/SiigoCredentialNotice.vue'

// Aprobación (recepción) de notas de traslado hacia una bodega de tránsito. El usuario solo puede aprobar notas de las
// bodegas de tránsito de sus tiendas asignadas; el token de Siigo solo sirve para ejecutar la acción.
const alerts = useAlertStore()
const { ready } = useSiigoCredentials(['token'])
const { get, handle, clear, message } = useServerErrors()

const query = ref('')
const note = ref(null)
const quantities = ref({}) // código => cantidad a aprobar
const searching = ref(false)
const confirming = ref(false)
const queued = ref(null)

const thousands = (value) => Math.round(Number(value) || 0).toLocaleString('es-CO')
// Las fechas de la nota llegan como AAAAMMDD
const noteDate = (value) => {
  const m = String(value ?? '').match(/^(\d{4})(\d{2})(\d{2})$/)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : value || '-'
}

const requested = computed(() => note.value?.items.reduce((sum, i) => sum + i.requested, 0) ?? 0)
const maxTotal = computed(() => note.value?.items.reduce((sum, i) => sum + i.max, 0) ?? 0)
const approving = computed(() => Object.values(quantities.value).reduce((sum, q) => sum + (Number(q) || 0), 0))

// Semáforo de cada cantidad: de más = azul (se bloquea al confirmar), igual al máximo = verde, menos = rojo
const state = (item) => {
  const value = Number(quantities.value[item.code]) || 0
  return value > item.max ? 'is-over' : value === item.max ? 'is-complete' : 'is-partial'
}
const stateClass = { 'is-over': 'border-info text-info', 'is-complete': 'border-success text-success', 'is-partial': 'border-danger text-danger' }
const normalize = (item) => {
  const value = parseInt(quantities.value[item.code], 10)
  quantities.value[item.code] = Number.isNaN(value) || value < 0 ? 0 : value
}

const search = async () => {
  clear()
  queued.value = null
  searching.value = true
  note.value = null
  try {
    const res = await TransferApprovalService.search(query.value.trim())
    note.value = res.data.note
    quantities.value = Object.fromEntries(note.value.items.map((i) => [i.code, i.max]))
  } catch (error) {
    handle(error)
  } finally {
    searching.value = false
  }
}

const reset = () => {
  note.value = null
  query.value = ''
  quantities.value = {}
  queued.value = null
  clear()
}

const confirm = async () => {
  clear()
  const over = note.value.items.find((i) => (Number(quantities.value[i.code]) || 0) > i.max)
  if (over) return alerts.warning('No puedes aprobar más unidades de las permitidas (en azul). Ajusta la cantidad e intenta de nuevo.')
  if (approving.value === 0) return alerts.warning('Debes aprobar al menos una unidad.')

  const ok = await confirmAction({
    title: 'Confirmar aprobación',
    text: `Se creará el traslado de ${note.value.transit.name} a ${note.value.destination.name} por ${thousands(approving.value)} unidades.`,
    confirmText: 'Sí, crear traslado',
  })
  if (!ok) return

  confirming.value = true
  try {
    const items = note.value.items.map((i) => ({ code: i.code, quantity: Number(quantities.value[i.code]) || 0 }))
    const res = await TransferApprovalService.confirm(note.value.code, items)
    queued.value = res.data.approval
    note.value = null
  } catch (error) {
    handle(error)
  } finally {
    confirming.value = false
  }
}
</script>

<template>
  <div class="fade-in">
    <SiigoCredentialNotice :kinds="['token']" />

    <CCard class="mb-4">
      <CCardHeader><strong>Traslados por recepcionar</strong></CCardHeader>
      <CCardBody>
        <p class="text-body-secondary">
          Escribe el número de la nota de traslado (por ejemplo <strong>NT-12345</strong>) que llegó a la bodega de tránsito para ver lo que trae, lo disponible y aprobar las unidades que recibiste.
        </p>
        <CAlert v-if="message && !queued" color="danger" class="mb-3">{{ message }}</CAlert>
        <form class="row g-2 align-items-start" autocomplete="off" @submit.prevent="search">
          <div class="col-md-6 col-lg-5">
            <FormField label="N.º de nota de traslado" required :error="get('query')" hint="Escríbelo tal como aparece en Siigo.">
              <input v-model="query" type="text" class="form-control" placeholder="Ej: NT-12345" required />
            </FormField>
          </div>
          <div class="col-auto" style="padding-top: 1.9rem">
            <Button type="submit" :loading="searching" :disabled="!ready || !query.trim()" :icon="cilSearch">Buscar</Button>
          </div>
        </form>
        <p v-if="get('token')" class="text-danger small mb-0">{{ get('token') }}</p>
      </CCardBody>
    </CCard>

    <JobQueuedNotice v-if="queued" class="mb-4" :message="`La aprobación de ${queued.code} fue recibida. El traslado se está creando por ${thousands(queued.units)} unidades.`" :emails="[queued.email]">
      <CButton color="primary" variant="outline" size="sm" class="mt-2" @click="reset"><CIcon :icon="cilReload" class="me-1" />Buscar otra nota</CButton>
    </JobQueuedNotice>

    <CCard v-if="note" class="fade-in">
      <CCardBody>
        <div class="d-flex flex-wrap justify-content-between gap-3 mb-4">
          <div>
            <h5 class="mb-2">{{ note.code }}</h5>
            <div class="text-body-secondary">Fecha NT: <strong>{{ noteDate(note.date) }}</strong> · Sale de: <strong>{{ note.origin }}</strong></div>
            <div class="text-body-secondary">Bodega de tránsito: <strong>{{ note.transit.name }}</strong> · Llega a: <strong>{{ note.destination.name }}</strong></div>
          </div>
          <div><CBadge color="success">En tránsito</CBadge></div>
        </div>

        <CRow class="g-3 mb-4">
          <CCol sm="4"><div class="rounded-3 p-3 text-white" style="background: #3f51b5"><div class="fs-4 fw-bold">{{ thousands(requested) }}</div><div class="small opacity-75">Cantidad en la nota</div></div></CCol>
          <CCol sm="4"><div class="rounded-3 p-3 text-white" style="background: #5c6bc0"><div class="fs-4 fw-bold">{{ thousands(maxTotal) }}</div><div class="small opacity-75">Máximo a aprobar</div></div></CCol>
          <CCol sm="4"><div class="rounded-3 p-3 text-white" style="background: #16a34a"><div class="fs-4 fw-bold">{{ thousands(approving) }}</div><div class="small opacity-75">Cantidad aprobando</div></div></CCol>
        </CRow>

        <h6>Items de la nota</h6>
        <CTable small hover responsive class="mb-4">
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>Descripción</CTableHeaderCell>
              <CTableHeaderCell>Referencia</CTableHeaderCell>
              <CTableHeaderCell>Color</CTableHeaderCell>
              <CTableHeaderCell>Talla</CTableHeaderCell>
              <CTableHeaderCell class="text-end">En la nota</CTableHeaderCell>
              <CTableHeaderCell class="text-end">Disponible</CTableHeaderCell>
              <CTableHeaderCell style="min-width: 190px">Aprobar</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            <CTableRow v-for="item in note.items" :key="item.code">
              <CTableDataCell>{{ item.description }}</CTableDataCell>
              <CTableDataCell>{{ item.reference || '-' }}</CTableDataCell>
              <CTableDataCell>{{ item.color || '-' }}</CTableDataCell>
              <CTableDataCell>{{ item.size || '-' }}</CTableDataCell>
              <CTableDataCell class="text-end">{{ thousands(item.requested) }}</CTableDataCell>
              <CTableDataCell class="text-end" :class="item.available < item.requested ? 'text-warning fw-bold' : 'text-success fw-bold'">{{ thousands(item.available) }}</CTableDataCell>
              <CTableDataCell>
                <div class="d-flex align-items-center gap-1">
                  <input
                    v-model.number="quantities[item.code]"
                    type="number"
                    min="0"
                    step="1"
                    class="form-control form-control-sm fw-bold"
                    :class="stateClass[state(item)]"
                    style="width: 90px"
                    :disabled="item.max === 0"
                    :aria-label="`Cantidad a aprobar de ${item.description}`"
                    @change="normalize(item)"
                  />
                  <CButton color="secondary" variant="outline" size="sm" :disabled="item.max === 0" @click="quantities[item.code] = item.max">Todo</CButton>
                  <CButton color="secondary" variant="outline" size="sm" :disabled="item.max === 0" @click="quantities[item.code] = 0">0</CButton>
                </div>
                <small v-if="(Number(quantities[item.code]) || 0) > item.max" class="text-info">Máximo {{ thousands(item.max) }}</small>
              </CTableDataCell>
            </CTableRow>
          </CTableBody>
        </CTable>

        <template v-if="note.images?.length">
          <h6>Imágenes por referencia</h6>
          <div class="d-flex flex-wrap gap-3 mb-4">
            <div v-for="card in note.images" :key="card.Reference" class="border rounded-3 p-2 text-center" style="width: 150px">
              <img v-if="card.Image" :src="card.Image" :alt="card.Reference" loading="lazy" class="img-fluid rounded mb-1" />
              <div v-else class="text-body-secondary small py-4">Sin imagen</div>
              <div class="fw-semibold small">{{ card.Reference }}</div>
              <div v-for="color in card.Colors" :key="color.Color" class="small text-body-secondary">{{ color.Color }}</div>
            </div>
          </div>
        </template>

        <div class="d-flex flex-wrap gap-2">
          <Button color="success" :loading="confirming" permission="integration.transfer_approval.confirm" :icon="cilCheckAlt" @click="confirm">Confirmar aprobación</Button>
          <CButton color="secondary" variant="outline" :disabled="confirming" @click="reset">Buscar otra nota</CButton>
        </div>
      </CCardBody>
    </CCard>
  </div>
</template>
