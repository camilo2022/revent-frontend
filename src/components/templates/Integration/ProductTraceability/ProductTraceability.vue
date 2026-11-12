<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { cilArrowLeft, cilCloudDownload, cilSearch } from '@coreui/icons'
import ProductTraceabilityService from '@/services/integration/ProductTraceabilityService'
import { saveBlob } from '@/services/BaseService'
import { useAlertStore } from '@/stores/alertStore'
import { useServerErrors } from '@/composables/useServerErrors'
import { errorMessage, listOf } from '@/utils/format'
import Button from '@/components/UI/templates/Button.vue'
import DownloadButton from '@/components/UI/templates/DownloadButton.vue'
import ExcelDropzone from '@/components/UI/templates/ExcelDropzone.vue'
import FormField from '@/components/UI/templates/FormField.vue'
import RequiredNote from '@/components/UI/templates/RequiredNote.vue'
import Skeleton from '@/components/UI/templates/Skeleton.vue'
import TraceabilityResult from './TraceabilityResult.vue'

// Trazabilidad de referencias: bodega, fecha inicial y Excel con los códigos. Consulta en pantalla (con auditoría de tránsitos) o descarga en Excel.
const alerts = useAlertStore()
const { get, errors, handle, clear } = useServerErrors()

const warehouses = ref([])
const loading = ref(true)
const form = reactive({ warehouse_id: '', start_date: '', file: null })
const busy = ref('') // '', 'search' o 'download'
const audit = ref(null)

const fileErrors = computed(() => errors.value.file ?? [])

onMounted(async () => {
  try {
    warehouses.value = listOf(await ProductTraceabilityService.warehouses(), 'warehouses')
  } catch (error) {
    alerts.error(errorMessage(error))
  }
  loading.value = false
})

const search = async () => {
  clear()
  busy.value = 'search'
  alerts.muted = true // la consulta no es una escritura: no hace falta el aviso de «operación completada»
  try {
    audit.value = (await ProductTraceabilityService.search(form)).data.audit
  } catch (error) {
    handle(error)
  } finally {
    alerts.muted = false
    busy.value = ''
  }
}

const download = async () => {
  clear()
  busy.value = 'download'
  try {
    saveBlob(await ProductTraceabilityService.download(form))
    alerts.success('Excel de trazabilidad descargado.')
  } catch (error) {
    handle(error)
  } finally {
    busy.value = ''
  }
}

const again = () => {
  audit.value = null
  clear()
}
</script>

<template>
  <TraceabilityResult v-if="audit" :audit="audit" @back="again">
    <template #back-icon><CIcon :icon="cilArrowLeft" /></template>
  </TraceabilityResult>

  <CCard v-else class="fade-in">
    <CCardHeader><strong>Buscar trazabilidad de referencias</strong></CCardHeader>
    <CCardBody>
      <p class="text-body-secondary">Selecciona la bodega, la fecha inicial y sube el archivo con las referencias a consultar.</p>
      <p class="d-flex flex-wrap align-items-center gap-2 text-body-secondary">
        Usa la plantilla Excel con la columna «codigo».
        <DownloadButton :request="ProductTraceabilityService.format" permission="integration.product_traceability.format" color="primary" success-message="Plantilla descargada.">Descargar formato</DownloadButton>
      </p>

      <Skeleton v-if="loading" variant="form" :rows="2" />
      <form v-else novalidate @submit.prevent="search">
        <h6 class="text-body-secondary mb-2">Parámetros de búsqueda</h6>
        <CRow>
          <CCol md="6">
            <FormField label="Bodega" required :error="get('warehouse_id')" hint="Se muestra de qué bodega a qué bodega fue cada traslado y se resaltan los que salieron o llegaron directo, sin pasar por la bodega «TRANSITO».">
              <select v-model="form.warehouse_id" class="form-select">
                <option value="" disabled>Selecciona una bodega</option>
                <option v-for="w in warehouses" :key="w.id" :value="String(w.id)">{{ w.name }}{{ w.transito ? '' : ' (sin bodega de tránsito)' }}</option>
              </select>
            </FormField>
            <p v-if="!warehouses.length" class="small text-warning">No tienes bodegas asignadas. Pide que te asignen una tienda.</p>
          </CCol>
          <CCol md="6">
            <FormField label="Fecha inicial" required :error="get('start_date')" hint="Se consultarán los movimientos desde esta fecha hacia adelante.">
              <input v-model="form.start_date" type="date" class="form-control" />
            </FormField>
          </CCol>
        </CRow>

        <h6 class="text-body-secondary mt-2 mb-2">Archivo de referencias</h6>
        <ExcelDropzone v-model="form.file" :max-mb="10" :invalid="!!fileErrors.length" @rejected="alerts.warning" />
        <ul v-if="fileErrors.length" class="invalid-feedback d-block mt-2 mb-0 ps-3">
          <li v-for="(message, i) in fileErrors" :key="i">{{ message }}</li>
        </ul>
        <div class="form-text">El archivo debe contener la columna con los códigos de referencia a buscar.</div>

        <div class="d-flex flex-wrap align-items-center gap-2 mt-4">
          <Button type="submit" :loading="busy === 'search'" :disabled="!form.file || !form.warehouse_id || !form.start_date || !!busy" permission="integration.product_traceability.search" :icon="cilSearch">Buscar trazabilidad</Button>
          <Button type="button" color="success" variant="outline" :loading="busy === 'download'" :disabled="!form.file || !form.warehouse_id || !form.start_date || !!busy" permission="integration.product_traceability.download" :icon="cilCloudDownload" @click="download">Descargar Excel</Button>
          <RequiredNote class="ms-2" />
        </div>
      </form>
    </CCardBody>
  </CCard>
</template>
