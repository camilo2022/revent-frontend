import http from '@/config/http'
import { call, callBlob } from '../BaseService'
import { toFormData } from '@/utils/format'

const base = '/integration/product_traceability'

// Trazabilidad de productos de una bodega: bodegas del usuario, plantilla, consulta (JSON) y descarga (Excel)
export default {
  base,
  warehouses: () => call(() => http.get(`${base}/warehouses`)),
  format: () => callBlob(() => http.get(`${base}/format`, { responseType: 'blob' }), 'formato_trazabilidad_producto.xlsx'),
  search: (form) => call(() => http.post(`${base}/search`, toFormData(form))),
  download: (form) => callBlob(() => http.post(`${base}/download`, toFormData(form), { responseType: 'blob' }), 'TRAZABILIDAD DE PRODUCTOS.xlsx'),
}
