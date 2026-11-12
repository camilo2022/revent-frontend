<script setup>
import { cilCloudDownload } from '@coreui/icons'
import { ref } from 'vue'
import { saveBlob } from '@/services/BaseService'
import { useAlertStore } from '@/stores/alertStore'
import { errorMessage } from '@/utils/format'
import Button from './Button.vue'

// Botón que pide un archivo a la API y lo descarga. `request` es una función que devuelve la promesa de callBlob ({ blob, name }).
const props = defineProps({
  request: { type: Function, required: true },
  permission: String,
  color: { type: String, default: 'success' },
  successMessage: { type: String, default: 'Archivo descargado.' },
})
const emit = defineEmits(['error', 'done'])
const alerts = useAlertStore()
const busy = ref(false)

const run = async () => {
  busy.value = true
  try {
    saveBlob(await props.request())
    alerts.success(props.successMessage)
    emit('done')
  } catch (error) {
    // Los errores 422 los maneja quien usa el botón; los demás se avisan aquí
    if (error?.errors) emit('error', error)
    else alerts.error(errorMessage(error))
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <Button :loading="busy" :permission="permission" :color="color" :icon="cilCloudDownload" @click="run"><slot>Descargar</slot></Button>
</template>
