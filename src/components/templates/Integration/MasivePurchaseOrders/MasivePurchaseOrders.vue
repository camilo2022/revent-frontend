<script setup>
import { computed, onMounted, ref } from 'vue'
import { cilSearch, cilSend } from '@coreui/icons'
import MasivePurchaseOrderService from '@/services/integration/MasivePurchaseOrderService'
import ProductPhotoService from '@/services/integration/ProductPhotoService'
import { useAlertStore } from '@/stores/alertStore'
import { useAuthStore } from '@/stores/authStore'
import { useServerErrors } from '@/composables/useServerErrors'
import { errorMessage, listOf } from '@/utils/format'
import { photoUrl } from '../photoUrl'
import Button from '@/components/UI/templates/Button.vue'
import ComboSelect from '@/components/UI/templates/ComboSelect.vue'
import DownloadButton from '@/components/UI/templates/DownloadButton.vue'
import ExcelDropzone from '@/components/UI/templates/ExcelDropzone.vue'
import FormField from '@/components/UI/templates/FormField.vue'
import JobQueuedNotice from '@/components/UI/templates/JobQueuedNotice.vue'
import RequiredNote from '@/components/UI/templates/RequiredNote.vue'
import SiigoCredentialNotice from '@/components/UI/templates/SiigoCredentialNotice.vue'

// Órdenes de compra masivas: se descarga el formato del tipo de orden (con tu cookie de Siigo), se diligencia y se carga;
// el resultado de cada orden llega por correo. Las fotos de la referencia deben estar cargadas en «Fotos de producto».
const auth = useAuthStore()
const alerts = useAlertStore()
const { get, errors, handle, clear } = useServerErrors()

const types = ref([])
const typeId = ref('')

const file = ref(null)
const email = ref('')
const referencia = ref('')
const busy = ref(false)
const queued = ref(null) // { email, referencia, lines }

const photos = ref(null) // null = sin verificar; { exists, referencia, photos[] }
const checking = ref(false)

const typeOptions = computed(() => types.value.map((t) => ({ value: t.id, label: t.name })))
const fileErrors = computed(() => errors.value.file ?? [])
const canCheckPhotos = computed(() => auth.can('integration.product_photos.search'))

onMounted(async () => {
  try {
    types.value = listOf(await MasivePurchaseOrderService.types(), 'types')
  } catch (error) {
    alerts.error(errorMessage(error))
  }
})

const downloadFormat = () => MasivePurchaseOrderService.format(typeId.value)

// Un error de validación del formato (cookie vencida, tipo inválido) se muestra en el campo
const onFormatError = (error) => handle(error)

const checkPhotos = async () => {
  if (!referencia.value.trim()) return
  checking.value = true
  photos.value = null
  try {
    const res = await ProductPhotoService.search(referencia.value.trim())
    photos.value = res.data
  } catch (error) {
    alerts.error(errorMessage(error))
  } finally {
    checking.value = false
  }
}

const submit = async () => {
  clear()
  busy.value = true
  try {
    const res = await MasivePurchaseOrderService.upload({ file: file.value, email: email.value.trim(), referencia: referencia.value.trim() })
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
  photos.value = null
  clear()
}
</script>

<template>
  <div class="d-flex flex-column gap-4 fade-in">
    <SiigoCredentialNotice />

    <CRow class="g-4">
      <!-- 1. Formato -->
      <CCol lg="5">
        <CCard class="h-100">
          <CCardHeader><strong>1. Descargar formato</strong></CCardHeader>
          <CCardBody>
            <p class="text-body-secondary">Elige el tipo de orden de compra y descarga la plantilla Excel. El formato trae tu cookie de Siigo y las listas de bodegas, impuestos y centros de costo.</p>
            <FormField label="Tipo de orden de compra" required :error="get('purchase_order_type_id')">
              <ComboSelect v-model="typeId" :options="typeOptions" placeholder="Selecciona un tipo" :invalid="!!get('purchase_order_type_id')" />
            </FormField>
            <p v-if="get('cookie')" class="text-danger small">{{ get('cookie') }}</p>
            <DownloadButton v-if="typeId" :request="downloadFormat" permission="integration.masive_purchase_orders.format" color="primary" success-message="Formato descargado." @error="onFormatError">
              Descargar formato
            </DownloadButton>
            <CButton v-else color="primary" disabled>Descargar formato</CButton>
          </CCardBody>
        </CCard>
      </CCol>

      <!-- 2. Carga -->
      <CCol lg="7">
        <CCard class="h-100">
          <CCardHeader><strong>2. Cargar archivo de órdenes de compra</strong></CCardHeader>
          <CCardBody>
            <div v-if="queued" class="d-flex flex-column gap-3">
              <JobQueuedNotice message="Órdenes de compra en proceso" :emails="[queued.email]">
                <div class="small mt-1">
                  Tu archivo ({{ queued.lines }} {{ queued.lines === 1 ? 'línea' : 'líneas' }}, referencia {{ queued.referencia }}) se recibió y se está procesando en segundo plano.
                  El resultado de cada orden, o el detalle de lo que falle, te llegará por correo.
                </div>
              </JobQueuedNotice>
              <div><CButton color="primary" variant="outline" size="sm" @click="reset">Cargar otro archivo</CButton></div>
            </div>

            <form v-else novalidate @submit.prevent="submit">
              <CRow>
                <CCol md="6">
                  <FormField label="Correo de notificación" required :error="get('email')" hint="Te enviaremos el resultado a este correo.">
                    <input v-model="email" type="email" class="form-control" placeholder="nombre@correo.com" autocomplete="off" />
                  </FormField>
                </CCol>
                <CCol md="6">
                  <FormField label="Referencia de las fotos" required :error="get('referencia')">
                    <div class="d-flex gap-2">
                      <input v-model="referencia" type="text" class="form-control" placeholder="Ej: VAMPELT" autocomplete="off" @input="photos = null" />
                      <CButton v-if="canCheckPhotos" color="secondary" variant="outline" :disabled="checking || !referencia.trim()" @click="checkPhotos">
                        <CIcon :icon="cilSearch" /> Verificar
                      </CButton>
                    </div>
                  </FormField>
                </CCol>
              </CRow>

              <div v-if="photos" class="mb-3">
                <CAlert :color="photos.exists ? 'success' : 'warning'" class="mb-0">
                  <template v-if="photos.exists">
                    La referencia <strong>{{ photos.referencia }}</strong> tiene {{ photos.photos.length }} {{ photos.photos.length === 1 ? 'foto' : 'fotos' }}.
                    <div class="d-flex flex-wrap gap-2 mt-2">
                      <img v-for="p in photos.photos.slice(0, 6)" :key="p.name" :src="photoUrl(p.url)" :alt="p.name" class="rounded border" style="width: 72px; height: 72px; object-fit: contain" />
                    </div>
                  </template>
                  <template v-else>No hay fotos cargadas para <strong>{{ photos.referencia }}</strong>. Cárgalas en «Fotos de producto» antes de enviar las órdenes.</template>
                </CAlert>
              </div>

              <ExcelDropzone v-model="file" :max-mb="20" :invalid="!!fileErrors.length" @rejected="alerts.warning" />
              <ul v-if="fileErrors.length" class="invalid-feedback d-block mt-2 mb-0 ps-3">
                <li v-for="(message, i) in fileErrors" :key="i">{{ message }}</li>
              </ul>

              <div class="d-flex flex-wrap align-items-center gap-3 mt-4">
                <Button type="submit" :loading="busy" :disabled="!file || !email.trim() || !referencia.trim()" permission="integration.masive_purchase_orders.upload" :icon="cilSend">Crear órdenes de compra</Button>
                <RequiredNote />
              </div>
            </form>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  </div>
</template>
