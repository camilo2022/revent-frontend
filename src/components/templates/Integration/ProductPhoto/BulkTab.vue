<script setup>
import { computed, ref, watch } from 'vue'
import { cilCloudUpload } from '@coreui/icons'
import ProductPhotoService from '@/services/integration/ProductPhotoService'
import { useAlertStore } from '@/stores/alertStore'
import { useServerErrors } from '@/composables/useServerErrors'
import { confirmAction } from '@/utils/swal'
import Button from '@/components/UI/templates/Button.vue'
import ExcelDropzone from '@/components/UI/templates/ExcelDropzone.vue'
import FormField from '@/components/UI/templates/FormField.vue'

// Carga masiva: un ZIP con las fotos de muchas referencias. El servidor revisa todo el ZIP antes de guardar nada;
// si algo falla muestra cada problema y no se guarda ninguna imagen.
const alerts = useAlertStore()
const { get, errors, handle, clear } = useServerErrors()

const modes = {
  folders: {
    label: 'ZIP con carpetas por referencia',
    hint: 'Cada carpeta debe llamarse como la referencia y contener las imágenes de ese producto. Se aceptan carpetas vacías. Ejemplo: CUÑIS/frontal.jpg, CUÑIS/lateral.png, SANDALIA45/foto1.webp.',
  },
  filenames: {
    label: 'ZIP con imágenes nombradas por referencia',
    hint: 'Todas las imágenes deben estar en la raíz del ZIP y el nombre de cada archivo, sin extensión, es la referencia. Ejemplo: CUÑIS.jpg.',
  },
}

const zip = ref(null)
const mode = ref('folders')
const busy = ref(false)
const result = ref(null) // { references_processed, images_uploaded, empty_folders }

const zipErrors = computed(() => errors.value.zip ?? [])

// Cambiar de modo o de archivo invalida el resultado anterior
watch([zip, mode], () => {
  result.value = null
  clear()
})

const upload = async () => {
  if (!(await confirmAction({ title: '¿Importar el ZIP?', text: 'Se guardarán las imágenes en el servidor, convertidas a WebP.', confirmText: 'Sí, importar', icon: 'question' }))) return
  clear()
  busy.value = true
  try {
    result.value = (await ProductPhotoService.bulkUpload({ zip: zip.value, zip_mode: mode.value })).data.bulk_upload
    zip.value = null
  } catch (error) {
    handle(error)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div>
    <p class="text-body-secondary">Carga las fotos de muchas referencias a la vez con un archivo ZIP.</p>

    <FormField label="Tipo de ZIP" required :error="get('zip_mode')" :hint="modes[mode].hint">
      <select v-model="mode" class="form-select">
        <option v-for="(item, key) in modes" :key="key" :value="key">{{ item.label }}</option>
      </select>
    </FormField>

    <p class="small text-body-secondary mb-2">
      Los nombres de referencia van en <strong>MAYÚSCULAS</strong> (se permite Ñ), números, guion o guion bajo. Solo se aceptan imágenes JPG, JPEG, PNG o WEBP de máximo 10 MB.
    </p>
    <ExcelDropzone v-model="zip" accept=".zip,application/zip" label="Arrastra tu archivo ZIP aquí o haz clic para elegirlo" :max-mb="500" :invalid="!!zipErrors.length" @rejected="alerts.warning" />

    <CAlert v-if="zipErrors.length" color="danger" class="mt-3 mb-0">
      <strong>El ZIP tiene problemas. No se guardó ninguna imagen.</strong>
      <ul class="mb-0 mt-2 ps-3 small">
        <li v-for="(message, i) in zipErrors" :key="i">{{ message }}</li>
      </ul>
    </CAlert>

    <CAlert v-if="result" color="success" class="mt-3 mb-0">
      <strong>¡Carga completada!</strong>
      <ul class="mb-0 mt-2 ps-3 small">
        <li>Referencias procesadas: {{ result.references_processed }}</li>
        <li>Imágenes cargadas: {{ result.images_uploaded }}</li>
        <li v-if="result.empty_folders">Carpetas vacías omitidas: {{ result.empty_folders }}</li>
      </ul>
    </CAlert>

    <div class="mt-4">
      <Button :loading="busy" :disabled="!zip" permission="integration.product_photos.bulk_upload" :icon="cilCloudUpload" @click="upload">Importar ZIP</Button>
    </div>
  </div>
</template>
