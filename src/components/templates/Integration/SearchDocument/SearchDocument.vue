<script setup>
import { computed, onMounted, ref } from 'vue'
import { cilCloudDownload, cilSearch } from '@coreui/icons'
import SearchDocumentService, { DOCUMENT_TYPES } from '@/services/integration/SearchDocumentService'
import { saveBlob } from '@/services/BaseService'
import { useServerErrors } from '@/composables/useServerErrors'
import { useSiigoCredentials } from '@/composables/useSiigoCredentials'
import { useAlertStore } from '@/stores/alertStore'
import { useAuthStore } from '@/stores/authStore'
import { errorMessage } from '@/utils/format'
import Button from '@/components/UI/templates/Button.vue'
import ComboSelect from '@/components/UI/templates/ComboSelect.vue'
import EmptyState from '@/components/UI/templates/EmptyState.vue'
import FormField from '@/components/UI/templates/FormField.vue'
import SiigoCredentialNotice from '@/components/UI/templates/SiigoCredentialNotice.vue'

// Buscar un documento de Siigo (nota de traslado u orden de compra): muestra sus productos y permite descargar su PDF.
// Cada tipo pide una credencial distinta: la nota de traslado el Token y la orden de compra la Cookie.
const auth = useAuthStore()
const alerts = useAlertStore()
const { get, handle, clear, errors, message } = useServerErrors()

const types = ref([])
const type = ref('')
const query = ref('')
const document = ref(undefined) // undefined = sin buscar, null = no existe
const searching = ref(false)
const downloading = ref(false)

const typeNumber = computed(() => (type.value === '' ? null : Number(type.value)))
const current = computed(() => types.value.find((t) => t.id === typeNumber.value))
const kinds = computed(() => (current.value ? [current.value.credential] : []))
const { ready } = useSiigoCredentials(() => kinds.value)
const options = computed(() => types.value.map((t) => ({ value: t.id, label: `${t.id} - ${t.name}` })))

const isNote = computed(() => typeNumber.value === DOCUMENT_TYPES.NOTE)
const canSearch = computed(() => auth.can(isNote.value ? 'integration.search_document.transfer_note' : 'integration.search_document.purchase_order'))
const canPdf = computed(() => auth.can(isNote.value ? 'integration.search_document.transfer_note_pdf' : 'integration.search_document.purchase_order_pdf'))

const total = (key) => (document.value?.Items ?? []).reduce((sum, i) => sum + (Number(i[key]) || 0), 0)
const money = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(v) || 0)

onMounted(async () => {
  try {
    types.value = (await SearchDocumentService.types()).data.types
  } catch (error) {
    alerts.error(errorMessage(error))
  }
})

const search = async () => {
  clear()
  document.value = undefined
  searching.value = true
  try {
    const res = await SearchDocumentService.search(typeNumber.value, query.value.trim())
    document.value = res.data.document
    if (!document.value) alerts.warning('No se encontró el documento en Siigo.')
  } catch (error) {
    handle(error)
  } finally {
    searching.value = false
  }
}

const download = async () => {
  clear()
  downloading.value = true
  try {
    saveBlob(await SearchDocumentService.pdf(typeNumber.value, query.value.trim()))
    alerts.success('PDF descargado.')
  } catch (error) {
    handle(error)
  } finally {
    downloading.value = false
  }
}
</script>

<template>
  <div class="fade-in">
    <SiigoCredentialNotice :kinds="kinds" />

    <CCard class="mb-4">
      <CCardHeader><strong>Buscar documento Siigo</strong></CCardHeader>
      <CCardBody>
        <p class="text-body-secondary">Selecciona el tipo de documento y escribe el código para ver su información y los productos que contiene, o descargar su PDF.</p>
        <CAlert v-if="message && !Object.keys(errors).length" color="danger" class="mb-3">{{ message }}</CAlert>
        <form autocomplete="off" @submit.prevent="search">
          <CRow>
            <CCol md="5">
              <FormField label="Tipo de documento" required :hint="current?.hint">
                <ComboSelect v-model="type" :options="options" />
              </FormField>
            </CCol>
            <CCol md="5">
              <FormField label="Código" required :error="get('query') || get('token') || get('cookie')" hint="Escríbelo tal como aparece en Siigo.">
                <input v-model="query" type="text" class="form-control" placeholder="Ej: NT-53384" required />
              </FormField>
            </CCol>
            <CCol md="2" class="d-flex align-items-start" style="padding-top: 1.9rem">
              <Button type="submit" :loading="searching" :disabled="!current || !ready || !query.trim() || !canSearch" :icon="cilSearch">Buscar</Button>
            </CCol>
          </CRow>
        </form>
      </CCardBody>
    </CCard>

    <CCard v-if="document" class="fade-in">
      <CCardHeader class="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <strong>{{ document.Code }}</strong>
        <Button color="success" :loading="downloading" :disabled="!ready || !canPdf" :icon="cilCloudDownload" @click="download">Descargar PDF</Button>
      </CCardHeader>
      <CCardBody>
        <p v-if="document.Description" class="text-body-secondary">{{ document.Description }}</p>
        <p v-if="document.Url" class="small"><a :href="document.Url" target="_blank" rel="noopener noreferrer">Abrir en Siigo</a></p>

        <EmptyState v-if="!document.Items?.length" text="El documento no tiene productos." />
        <CTable v-else small hover responsive>
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>Descripción</CTableHeaderCell>
              <CTableHeaderCell>Referencia</CTableHeaderCell>
              <CTableHeaderCell>Color</CTableHeaderCell>
              <CTableHeaderCell>Talla</CTableHeaderCell>
              <template v-if="isNote">
                <CTableHeaderCell>Bodega de salida</CTableHeaderCell>
                <CTableHeaderCell>Bodega de entrada</CTableHeaderCell>
              </template>
              <CTableHeaderCell class="text-end">Cantidad</CTableHeaderCell>
              <template v-if="!isNote">
                <CTableHeaderCell class="text-end">Vr. unitario</CTableHeaderCell>
                <CTableHeaderCell class="text-end">Vr. total</CTableHeaderCell>
              </template>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            <CTableRow v-for="(item, i) in document.Items" :key="i">
              <CTableDataCell>{{ item.Description }}</CTableDataCell>
              <CTableDataCell>{{ item.Reference || '-' }}</CTableDataCell>
              <CTableDataCell>{{ item.Color || '-' }}</CTableDataCell>
              <CTableDataCell>{{ item.Size || '-' }}</CTableDataCell>
              <template v-if="isNote">
                <CTableDataCell>{{ item.WarehouseOrigin }}</CTableDataCell>
                <CTableDataCell>{{ item.WarehouseDestination }}</CTableDataCell>
              </template>
              <CTableDataCell class="text-end">{{ (Number(item.Quantity) || 0).toLocaleString('es-CO') }}</CTableDataCell>
              <template v-if="!isNote">
                <CTableDataCell class="text-end">{{ money(item.UnitValue) }}</CTableDataCell>
                <CTableDataCell class="text-end">{{ money(item.Total) }}</CTableDataCell>
              </template>
            </CTableRow>
            <CTableRow class="table-light fw-bold">
              <CTableDataCell :colspan="isNote ? 6 : 4">Total</CTableDataCell>
              <CTableDataCell class="text-end">{{ total('Quantity').toLocaleString('es-CO') }}</CTableDataCell>
              <template v-if="!isNote">
                <CTableDataCell />
                <CTableDataCell class="text-end">{{ money(total('Total')) }}</CTableDataCell>
              </template>
            </CTableRow>
          </CTableBody>
        </CTable>
      </CCardBody>
    </CCard>
  </div>
</template>
