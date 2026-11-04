import dayjs from 'dayjs'

// Precio en pesos colombianos
export function money(value) {
  if (value === null || value === undefined || value === '') return '-'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)
}

// Fecha corta DD/MM/YYYY
export function date(value) {
  return value ? dayjs(value).format('DD/MM/YYYY') : '-'
}

// Mensaje legible a partir del cuerpo de error de la API
export function errorMessage(error) {
  return error?.error?.message || error?.message || 'Error desconocido'
}
