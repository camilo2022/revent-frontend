import { defineStore } from 'pinia'
import { ref } from 'vue'

// Confirmaciones: `await openSwal({...})` abre el diálogo (SwalContainer) y devuelve true/false
export const useSwalStore = defineStore('swalStore', () => {
  const swalData = ref(null)
  let resolver = null

  const openSwal = (options) =>
    new Promise((resolve) => {
      swalData.value = options
      resolver = resolve
    })

  const resolveSwal = (result) => {
    resolver?.(result)
    resolver = null
    swalData.value = null
  }

  // Confirmación estándar
  const confirm = ({ title = '¿Estás seguro?', text = '', confirmText = 'Sí, continuar', icon = 'question' } = {}) =>
    openSwal({ title, text, confirmText, icon })

  return { swalData, openSwal, resolveSwal, confirm }
})
