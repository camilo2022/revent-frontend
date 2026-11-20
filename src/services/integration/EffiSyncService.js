import http from '@/config/http'
import { call } from '../BaseService'

// Sincronización de la bodega WEB de Siigo con Effi. compare y plan solo consultan; sync escribe en Effi (en segundo plano)
const base = '/integration/effi_sync'

export default {
  base,
  compare: () => call(() => http.get(`${base}/compare`)),
  plan: () => call(() => http.get(`${base}/plan`)),
  sync: (body) => call(() => http.post(`${base}/sync`, body)),
  status: () => call(() => http.get(`${base}/status`)),
}
