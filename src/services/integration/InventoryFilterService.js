import http from '@/config/http'
import { call } from '../BaseService'

const base = '/integration/inventory_filter'

// Filtro de inventario. Todo se consulta en Siigo cada vez que se pide (sin caché propio en el front); la API entrega solo
// las bodegas de las tiendas asignadas al usuario.
export default {
  base,
  catalogs: () => call(() => http.get(`${base}/catalogs`)),
  // Productos de una bodega con su stock por color y talla
  search: (warehouseId) => call(() => http.get(`${base}/search`, { params: { warehouse_id: warehouseId } })),
  // Stock de una referencia en todas las bodegas (puede tardar unos segundos)
  allWarehouses: (referencia) => call(() => http.get(`${base}/all_warehouses`, { params: { referencia } })),
  // Fotos de una referencia, paginadas (máximo 12 por página)
  images: (referencia, page = 1, perPage = 12) => call(() => http.get(`${base}/images`, { params: { referencia, page, per_page: perPage } })),
}
