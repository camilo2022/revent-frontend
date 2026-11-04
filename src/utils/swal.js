import { useAlertStore } from '@/stores/alertStore'
import { useSwalStore } from '@/stores/swalStore'

// Atajos sobre los stores de alertas y confirmaciones
export const confirmAction = (options) => useSwalStore().confirm(options)
export const notify = (text) => useAlertStore().success(text)
export const notifyError = (text) => useAlertStore().error(text)
