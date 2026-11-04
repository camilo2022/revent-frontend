import Swal from 'sweetalert2'

// Confirmación estándar; devuelve true si el usuario acepta
export async function confirmAction({ title = '¿Estás seguro?', text = '', confirmText = 'Sí, continuar', icon = 'question' } = {}) {
  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#16a34a',
    reverseButtons: true,
  })
  return result.isConfirmed
}

// Aviso breve de éxito
export function notify(text, icon = 'success') {
  Swal.fire({ toast: true, position: 'top-end', icon, title: text, showConfirmButton: false, timer: 2500 })
}
