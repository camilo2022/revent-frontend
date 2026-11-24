import http from '@/config/http'
import { call, createService } from './BaseService'

// Tipos de solicitud (subítems con la estructura de su formulario) y los metadatos para armarlos
const base = '/request_types'

export default {
  ...createService(base),
  metadata: () => call(() => http.get(`${base}/metadata`)),
}
