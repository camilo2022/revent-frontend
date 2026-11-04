import { onBeforeUnmount } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useSwalStore } from '@/stores/swalStore'

// Aviso de cambios sin guardar. Solo hay un formulario abierto a la vez: se registra una
// función `isDirty` y `confirmLeave()` pregunta antes de cerrar el panel o salir de la ruta.
let dirtyCheck = null
let asking = false

export const setDirtyCheck = (fn) => (dirtyCheck = fn)

export async function confirmLeave() {
  if (!dirtyCheck?.()) return true
  if (asking) return false // ya hay una pregunta abierta (Escape + modal, por ejemplo)
  asking = true
  try {
    return await useSwalStore().confirm({
      title: 'Tienes cambios sin guardar',
      text: '¿Salir de todos modos? Se perderá lo que escribiste.',
      confirmText: 'Sí, salir sin guardar',
      icon: 'warning',
    })
  } finally {
    asking = false
  }
}

// Para formularios propios: `mark()` guarda la foto del estado (tras cargar o guardar) y
// `isDirty()` compara contra ella. Registra también el guard de salida de ruta.
export function useUnsavedChanges(serialize) {
  let snapshot = null
  const mark = () => (snapshot = serialize())
  const isDirty = () => snapshot !== null && serialize() !== snapshot
  setDirtyCheck(isDirty)
  onBeforeRouteLeave(() => confirmLeave())
  onBeforeUnmount(() => {
    if (dirtyCheck === isDirty) setDirtyCheck(null)
  })
  return { mark, isDirty, confirmLeave }
}
