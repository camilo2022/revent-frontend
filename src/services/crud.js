import api from '@/API/api'
import { getConfig } from '@/axiosConfig'
import { toFormData } from '@/utils/format'

// Ejecuta la petición y devuelve el cuerpo; en error lanza el cuerpo de la API
export async function call(request) {
  try {
    const response = await request()
    return response.data
  } catch (error) {
    throw error.response?.data ?? { message: 'Error desconocido' }
  }
}

// Servicio de solo lectura (ubicaciones, auditoría)
export function makeReadOnly(base) {
  return {
    all: (params = {}) => call(() => api.get(`${base}/all`, getConfig(params))),
    find: (id) => call(() => api.get(`${base}/find/${id}`, getConfig())),
  }
}

// Servicio base con las acciones comunes de un recurso
export function makeCrud(base) {
  return {
    ...makeReadOnly(base),
    store: (data) => call(() => api.post(`${base}/store`, data, getConfig())),
    update: (id, data) => call(() => api.put(`${base}/update/${id}`, data, getConfig())),
    // Con archivos: multipart; en la actualización se simula PUT con _method
    storeForm: (data) => call(() => api.post(`${base}/store`, toFormData(data), getConfig())),
    updateForm: (id, data) => call(() => api.post(`${base}/update/${id}`, toFormData({ ...data, _method: 'PUT' }), getConfig())),
    delete: (id) => call(() => api.delete(`${base}/delete/${id}`, getConfig())),
    restore: (id) => call(() => api.patch(`${base}/restore/${id}`, {}, getConfig())),
  }
}

// assign/remove de permisos o subcategorías: POST {base}/{prefix}/assign/{id}
export function makeAssign(path) {
  return {
    assign: (id, data) => call(() => api.post(`${path}/assign/${id}`, data, getConfig())),
    remove: (id, data) => call(() => api.post(`${path}/remove/${id}`, data, getConfig())),
  }
}
