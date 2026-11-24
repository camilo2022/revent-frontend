import http from '@/config/http'
import { call, createService } from './BaseService'

// Solicitudes: CRUD propio, cambio de estado (gestión) y opciones de los select dinámicos
const base = '/requisitions'
const options = (model, params = {}) => call(() => http.get(`${base}/options/${model}`, { params }))

export default {
  ...createService(base),
  status: (id, body) => call(() => http.put(`${base}/status/${id}`, body)),
  options,
  // Servicio para SearchSelect: busca en el servidor por página
  optionsService: (model) => ({ all: (params) => options(model, params) }),
}
