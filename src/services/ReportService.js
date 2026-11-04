import http from '@/config/http'
import { call } from './BaseService'

const base = '/reports'

// Reportes: listar, consultar campos y filtros, generar y exportar a Excel (se descarga como archivo)
export default {
  base,
  all: (params = {}) => call(() => http.get(`${base}/all`, { params })),
  find: (id) => call(() => http.get(`${base}/find/${id}`)),
  generate: (id, body) => call(() => http.post(`${base}/generate/${id}`, body)),
  export: async (id, body) => {
    try {
      const response = await http.post(`${base}/export/${id}`, body, { responseType: 'blob' })
      const disposition = response.headers['content-disposition'] ?? ''
      const name = /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? 'reporte.xlsx'
      return { blob: response.data, name }
    } catch (error) {
      // Con responseType blob el error llega como Blob: se lee para conservar el mensaje de la API
      const text = error.response?.data instanceof Blob ? await error.response.data.text() : null
      throw (text ? JSON.parse(text) : error.response?.data) ?? { message: 'Error desconocido' }
    }
  },
}
