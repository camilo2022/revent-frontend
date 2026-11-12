import http from '@/config/http'
import { call } from '../BaseService'
import { formWithSiigo, withSiigo } from './IntegrationService'

const base = '/integration/purchase_order_reception'

// Un FormData envía los booleanos como texto: se mandan como 1/0, que es lo que valida la API
const asFlags = (value) => {
  if (typeof value === 'boolean') return value ? 1 : 0
  if (Array.isArray(value)) return value.map(asFlags)
  if (value && typeof value === 'object' && !(value instanceof Blob)) return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, asFlags(v)]))
  return value
}

// Recepción de órdenes de compra: el token de Siigo guardado en "Autorización Siigo" se adjunta solo a cada petición.
// withSiigo / formWithSiigo se evalúan fuera de call() para conservar su mensaje cuando falta el token.
export default {
  base,
  search: async (query) => {
    const payload = withSiigo(['token'], { query })
    return call(() => http.post(`${base}/search`, payload))
  },
  // receiving: { Order, Items, Totals, Checklist }; imagenes: archivos de evidencia (JPG/PNG)
  confirm: async ({ receiving, imagenes }) => {
    const form = formWithSiigo(['token'], { receiving: asFlags(receiving), imagenes })
    return call(() => http.post(`${base}/confirm`, form))
  },
}
