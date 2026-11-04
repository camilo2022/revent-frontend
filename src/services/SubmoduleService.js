import http from '@/config/http'
import { call, createService } from './BaseService'

const base = '/navegation/submodules'

// La lista pide el módulo en la ruta: all({ module_id, ...filtros })
export default {
  ...createService(base),
  all: ({ module_id, ...params }) => call(() => http.get(`${base}/all/${module_id}`, { params })),
}
