import http from '@/config/http'
import { call } from '../BaseService'
import { withSiigo } from './IntegrationService'

const base = '/integration/transfer_approval'

// Aprobación de traslados: el token de Siigo guardado en "Autorización Siigo" se adjunta solo a cada petición
export default {
  base,
  search: (query) => call(() => http.post(`${base}/search`, withSiigo(['token'], { query }))),
  confirm: (query, items) => call(() => http.post(`${base}/confirm`, withSiigo(['token'], { query, items }))),
}
