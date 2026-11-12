import http from '@/config/http'
import { call, createService } from './BaseService'

const base = '/stores'

// Tiendas; siigoWarehouses lista las bodegas de Siigo para asociarlas a una tienda
export default {
  ...createService(base),
  siigoWarehouses: () => call(() => http.get(`${base}/siigo_warehouses`)),
}
