import api from '@/API/api'
import { getConfig } from '@/axiosConfig'

// Ejecuta la petición y devuelve el cuerpo; en error lanza el cuerpo de la API
export async function call(request) {
  try {
    const response = await request()
    return response.data
  } catch (error) {
    throw error.response?.data ?? { message: 'Error desconocido' }
  }
}

// Servicio base con las acciones comunes de un recurso
export function makeCrud(base) {
  return {
    all: (params = {}) => call(() => api.get(`${base}/all`, getConfig(params))),
    find: (id) => call(() => api.get(`${base}/find/${id}`, getConfig())),
    store: (data) => call(() => api.post(`${base}/store`, data, getConfig())),
    update: (id, data) => call(() => api.put(`${base}/update/${id}`, data, getConfig())),
    delete: (id) => call(() => api.delete(`${base}/delete/${id}`, getConfig())),
    restore: (id) => call(() => api.patch(`${base}/restore/${id}`, {}, getConfig())),
  }
}
