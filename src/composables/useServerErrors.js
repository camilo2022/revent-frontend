import { ref } from 'vue'
import { useAlertStore } from '@/stores/alertStore'
import { errorMessage } from '@/utils/format'

// Guarda los errores 422 por campo (incluye claves anidadas como `a.0.b`)
export function useServerErrors() {
  const errors = ref({})
  const message = ref('')
  const attributes = ref({}) // nombre legible de cada campo, como lo manda el backend

  const clear = () => {
    errors.value = {}
    message.value = ''
    attributes.value = {}
  }

  // Primer mensaje de un campo
  const get = (field) => errors.value[field]?.[0] ?? ''

  // 422 llena los campos; cualquier otro error se avisa con una alerta flotante
  const handle = (error, { alert = true } = {}) => {
    clear()
    if (error?.errors) {
      errors.value = error.errors
      attributes.value = error.attributes ?? {}
      message.value = error.message ?? 'Error de validación.'
      useAlertStore().warning('Revisa los campos marcados en rojo.')
    } else {
      message.value = errorMessage(error)
      if (alert) useAlertStore().error(message.value)
    }
  }

  return { errors, message, attributes, get, clear, handle }
}
