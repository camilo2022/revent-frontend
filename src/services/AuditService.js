import http from '@/config/http'
import { call } from './BaseService'

// Historial de un registro: GET /{módulo}/audits/{id}
export default {
  record: (base, id, params = {}) => call(() => http.get(`${base}/audits/${id}`, { params })),
}
