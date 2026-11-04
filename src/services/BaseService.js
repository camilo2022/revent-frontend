import http from '@/config/http'
import { toFormData } from '@/utils/format'

// Ejecuta la petición y devuelve el cuerpo; en error lanza el cuerpo de la API (igual que Kanri)
export async function call(request) {
  try {
    const response = await request()
    return response.data
  } catch (error) {
    throw error.response?.data ?? { message: 'Error desconocido' }
  }
}

// Servicio de solo lectura (ubicaciones, auditoría)
export function readOnlyService(base) {
  return {
    base,
    all: (params = {}) => call(() => http.get(`${base}/all`, { params })),
    find: (id) => call(() => http.get(`${base}/find/${id}`)),
  }
}

// Servicio con all/find/store/update/delete/restore; storeForm/updateForm envían multipart
export function createService(base) {
  return {
    base,
    ...readOnlyService(base),
    store: (data) => call(() => http.post(`${base}/store`, data)),
    update: (id, data) => call(() => http.put(`${base}/update/${id}`, data)),
    storeForm: (data) => call(() => http.post(`${base}/store`, toFormData(data))),
    // PUT no admite multipart en PHP: se simula con _method
    updateForm: (id, data) => call(() => http.post(`${base}/update/${id}`, toFormData({ ...data, _method: 'PUT' }))),
    delete: (id) => call(() => http.delete(`${base}/delete/${id}`)),
    restore: (id) => call(() => http.patch(`${base}/restore/${id}`, {})),
  }
}

// assign/remove (permisos o subcategorías): POST {path}/assign/{id}
export function assignService(path) {
  return {
    assign: (id, data) => call(() => http.post(`${path}/assign/${id}`, data)),
    remove: (id, data) => call(() => http.post(`${path}/remove/${id}`, data)),
  }
}
