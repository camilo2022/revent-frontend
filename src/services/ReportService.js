import http from '@/config/http'
import { call, callBlob } from './BaseService'

const base = '/reports'

// Reportes: listar, consultar campos y filtros, generar y exportar a Excel (se descarga como archivo)
export default {
  base,
  all: (params = {}) => call(() => http.get(`${base}/all`, { params })),
  // Con params.context (ej. tipo de solicitud) la definición trae también sus campos
  find: (id, params = {}) => call(() => http.get(`${base}/find/${id}`, { params })),
  generate: (id, body) => call(() => http.post(`${base}/generate/${id}`, body)),
  export: (id, body) => callBlob(() => http.post(`${base}/export/${id}`, body, { responseType: 'blob' }), 'reporte.xlsx'),
}
