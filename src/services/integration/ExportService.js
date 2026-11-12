import http from '@/config/http'
import { call } from '../BaseService'

const base = '/integration/exports'

// Exportes de Siigo por correo: responden 202 { export: { emails, jobs } }; el archivo llega al correo cuando termina
export default {
  base,
  inventory: (body) => call(() => http.post(`${base}/inventory`, body)),
  invoice: (body) => call(() => http.post(`${base}/invoice`, body)),
  invoice360: (body) => call(() => http.post(`${base}/invoice_360`, body)),
  purchase: (body) => call(() => http.post(`${base}/purchase`, body)),
}
