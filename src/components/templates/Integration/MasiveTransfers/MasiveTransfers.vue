<script setup>
import { computed, ref } from 'vue'
import { cilSend } from '@coreui/icons'
import MasiveTransferService from '@/services/integration/MasiveTransferService'
import { useAlertStore } from '@/stores/alertStore'
import { useServerErrors } from '@/composables/useServerErrors'
import Button from '@/components/UI/templates/Button.vue'
import DownloadButton from '@/components/UI/templates/DownloadButton.vue'
import ExcelDropzone from '@/components/UI/templates/ExcelDropzone.vue'
import FormField from '@/components/UI/templates/FormField.vue'
import JobQueuedNotice from '@/components/UI/templates/JobQueuedNotice.vue'
import RequiredNote from '@/components/UI/templates/RequiredNote.vue'

// Traslados masivos entre bodegas: se descarga el formato, se llena y se carga; el resultado de cada traslado llega por correo
const alerts = useAlertStore()
const { get, errors, handle, clear } = useServerErrors()

const file = ref(null)
const email = ref('')
const busy = ref(false)
const queued = ref(null) // { email, lines }

const fileErrors = computed(() => errors.value.file ?? [])

const submit = async () => {
  clear()
  busy.value = true
  try {
    const res = await MasiveTransferService.upload({ file: file.value, email: email.value.trim() })
    queued.value = res.data.upload
  } catch (error) {
    handle(error)
  } finally {
    busy.value = false
  }
}

const reset = () => {
  queued.value = null
  file.value = null
  clear()
}
</script>

<template>
  <CCard class="fade-in">
    <CCardHeader><strong>Cargar archivo de traslados masivos</strong></CCardHeader>
    <CCardBody>
      <!-- Archivo recibido -->
      <div v-if="queued" class="d-flex flex-column gap-3">
        <JobQueuedNotice message="Traslado masivo en proceso" :emails="[queued.email]">
          <div class="small mt-1">
            Tu archivo ({{ queued.lines }} {{ queued.lines === 1 ? 'línea' : 'líneas' }}) se recibió y se está procesando en segundo plano: se validan las bodegas, existencias y productos.
            Si todo sale bien recibirás el detalle de cada traslado; si algo falla (bodega sin acceso, cantidad insuficiente…) también te llegará por correo con el detalle de cada error.
          </div>
        </JobQueuedNotice>
        <div><CButton color="primary" variant="outline" size="sm" @click="reset">Cargar otro archivo</CButton></div>
      </div>

      <form v-else novalidate @submit.prevent="submit">
        <p class="text-body-secondary d-flex flex-wrap align-items-center gap-2">
          Sube la plantilla Excel (.xlsx o .xls) para procesar los traslados.
          <DownloadButton :request="MasiveTransferService.format" permission="integration.masive_transfers.format" color="primary" success-message="Formato descargado.">Descargar formato</DownloadButton>
        </p>

        <CRow>
          <CCol md="6">
            <FormField label="Correo de notificación" required :error="get('email')" hint="Te enviaremos el resultado a este correo.">
              <input v-model="email" type="email" class="form-control" placeholder="nombre@correo.com" autocomplete="off" />
            </FormField>
          </CCol>
        </CRow>

        <ExcelDropzone v-model="file" :max-mb="20" :invalid="!!fileErrors.length" @rejected="alerts.warning" />
        <ul v-if="fileErrors.length" class="invalid-feedback d-block mt-2 mb-0 ps-3">
          <li v-for="(message, i) in fileErrors" :key="i">{{ message }}</li>
        </ul>

        <div class="d-flex flex-wrap align-items-center gap-3 mt-4">
          <Button type="submit" :loading="busy" :disabled="!file || !email.trim()" permission="integration.masive_transfers.upload" :icon="cilSend">Realizar traslados</Button>
          <RequiredNote />
        </div>
      </form>
    </CCardBody>
  </CCard>
</template>
