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

// Primer valor de `data` (la API nombra el registro: person, user, role...)
export function firstOf(res) {
  return Object.values(res.data ?? {})[0] ?? null
}

// URL pública de un archivo guardado en el disco público del backend
export function fileUrl(file) {
  if (!file?.path) return ''
  return `${new URL(import.meta.env.VITE_API_URL, window.location.origin).origin}/storage/${file.path}`
}

// Objeto plano => FormData (omite nulos y vacíos; los archivos pasan tal cual)
export function toFormData(obj, fd = new FormData(), prefix = '') {
  Object.entries(obj).forEach(([k, v]) => {
    const key = prefix ? `${prefix}[${k}]` : k
    if (v === null || v === undefined || v === '') return
    if (typeof v === 'object' && !(v instanceof Blob)) toFormData(v, fd, key) // anidados: icon[file]
    else fd.append(key, v)
  })
  return fd
}

// Arreglo de una respuesta de lista (soporta que la API devuelva el arreglo directo)
export function listOf(res, listKey) {
  const d = res.data
  return Array.isArray(d) ? d : d?.[listKey] ?? d?.data ?? []
}
