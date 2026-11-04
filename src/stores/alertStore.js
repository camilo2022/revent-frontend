import { defineStore } from 'pinia'
import { ref } from 'vue'

// Alertas flotantes (type: success | danger | warning | info)
export const useAlertStore = defineStore('alertStore', () => {
  const alerts = ref([])
  const muted = ref(false) // los procesos con varias llamadas avisan una sola vez al final

  const removeAlert = (id) => {
    alerts.value = alerts.value.filter((a) => a.id !== id)
  }

  const addAlert = (alert) => {
    const id = Date.now() + Math.random()
    alerts.value.push({ type: 'info', ...alert, id })
    setTimeout(() => removeAlert(id), alert.duration ?? 5000)
  }

  // Atajos comunes
  const success = (message) => addAlert({ type: 'success', message })
  const warning = (message) => addAlert({ type: 'warning', message })
  const error = (message) => addAlert({ type: 'danger', message, duration: 7000 })

  return { alerts, muted, addAlert, removeAlert, success, warning, error }
})
