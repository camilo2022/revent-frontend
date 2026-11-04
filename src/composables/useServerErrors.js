import { ref } from 'vue'
import { useAlertStore } from '@/stores/alertStore'
import { errorMessage } from '@/utils/format'

// Guarda los errores 422 por campo (incluye claves anidadas como `a.0.b`)
export function useServerErrors() {
  const errors = ref({})
  const message = ref('')

  const clear = () => {
    errors.value = {}
    message.value = ''
  }

  // Primer mensaje de un campo
  const get = (field) => errors.value[field]?.[0] ?? ''

  // 422 llena los campos; cualquier otro error se avisa con una alerta flotante
  const handle = (error, { alert = true } = {}) => {
    clear()
    if (error?.errors) {
      errors.value = error.errors
      message.value = error.message ?? 'Error de validación.'
    } else {
      message.value = errorMessage(error)
      if (alert) useAlertStore().error(message.value)
    }
  }

  return { errors, message, get, clear, handle }
}
