import http from '@/config/http'
import { call } from '../BaseService'
import { withSiigo } from './IntegrationService'

const base = '/integration/customer_sales'

// Clientes por venta: centros de costo y consulta por fecha (el token de Siigo se adjunta solo desde Autorización Siigo)
export default {
  base,
  costCenters: () => call(() => http.get(`${base}/cost_centers`)),
  // withSiigo se evalúa fuera de call() para conservar su mensaje cuando falta el token
  search: async (body) => {
    const payload = withSiigo(['token'], body)
    return call(() => http.post(`${base}/search`, payload))
  },
}
