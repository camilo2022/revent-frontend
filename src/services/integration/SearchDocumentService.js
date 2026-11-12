import http from '@/config/http'
import { call, callBlob } from '../BaseService'
import { withSiigo } from './IntegrationService'

const base = '/integration/search_document'

// Buscar documento de Siigo. La nota de traslado (23) usa el Token y la orden de compra (19) la Cookie;
// la credencial guardada en "Autorización Siigo" se adjunta sola.
const NOTE = 23
const ORDER = 19

export const DOCUMENT_TYPES = { NOTE, ORDER }

export default {
  base,
  types: () => call(() => http.get(`${base}/types`)),
  search: (type, query) =>
    type === NOTE
      ? call(() => http.post(`${base}/transfer_note`, withSiigo(['token'], { query })))
      : call(() => http.post(`${base}/purchase_order`, withSiigo(['cookie'], { query }))),
  pdf: (type, query) =>
    type === NOTE
      ? callBlob(() => http.post(`${base}/transfer_note_pdf`, withSiigo(['token'], { query }), { responseType: 'blob' }), 'nota_traslado.pdf')
      : callBlob(() => http.post(`${base}/purchase_order_pdf`, withSiigo(['cookie'], { query }), { responseType: 'blob' }), 'orden_compra.pdf'),
}
