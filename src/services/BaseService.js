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

// Descarga de archivos (xlsx, pdf): `request` debe pedir responseType 'blob'. Devuelve { blob, name } con el nombre de content-disposition.
// En error el cuerpo llega como Blob: se lee para conservar el mensaje de la API.
export async function callBlob(request, fallbackName = 'archivo') {
  try {
    const response = await request()
    const disposition = response.headers['content-disposition'] ?? ''
    const name = /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? fallbackName
    return { blob: response.data, name }
  } catch (error) {
    const text = error.response?.data instanceof Blob ? await error.response.data.text() : null
    let body = null
    try {
      body = text ? JSON.parse(text) : error.response?.data
    } catch {
      body = null
    }
    throw body ?? { message: 'Error desconocido' }
  }
}

// Guarda en el equipo un archivo recibido con callBlob
export function saveBlob({ blob, name }) {
  const url = URL.createObjectURL(blob)
  const link = Object.assign(document.createElement('a'), { href: url, download: name })
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
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

// Servicio de registros hijos (subcategorías de una categoría, tipos de documento de un tipo de persona, permisos de un rol):
// siempre se consulta por el id del padre, que va en la ruta: {base}/all/{parentId}; en store/update va en el cuerpo.
export function createChildService(base, parentKey) {
  const service = createService(base)
  return {
    ...service,
    parentKey,
    all: ({ [parentKey]: parentId, ...params } = {}) => call(() => http.get(`${base}/all/${parentId}`, { params })),
  }
}

// assign/remove (permisos o subcategorías): POST {path}/assign/{id}
export function assignService(path) {
  return {
    assign: (id, data) => call(() => http.post(`${path}/assign/${id}`, data)),
    remove: (id, data) => call(() => http.post(`${path}/remove/${id}`, data)),
  }
}
