import http from '@/config/http'
import { call } from './BaseService'

// Historial de un registro: GET /{módulo}/audits/{id}
// Las rutas de auditoría del backend van por módulo sin el prefijo del grupo (/categorization/categories → /categories, /authorization/roles → /roles, etc.)
const module = (base) => '/' + String(base).split('/').filter(Boolean).pop()

export default {
  record: (base, id, params = {}) => call(() => http.get(`${module(base)}/audits/${id}`, { params })),
}
