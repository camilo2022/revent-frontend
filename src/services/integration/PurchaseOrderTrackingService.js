import http from '@/config/http'
import { call, callBlob } from '../BaseService'

const base = '/integration/purchase_order_tracking'

// Seguimiento de órdenes de compra: cada orden con lo pedido, lo recibido en facturas de compra y lo pendiente
export default {
  base,
  documents: () => call(() => http.get(`${base}/documents`)),
  // Excel de referencias que aún no se han recibido
  missingDownload: () => callBlob(() => http.get(`${base}/missing_download`, { responseType: 'blob' }), 'referencias_faltantes.xlsx'),
}
