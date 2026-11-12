import http from '@/config/http'
import { call, callBlob } from '../BaseService'
import { toFormData } from '@/utils/format'
import { withSiigo } from './IntegrationService'

const base = '/integration/masive_purchase_orders'

// Órdenes de compra masivas: tipos, formato de Excel (necesita tu cookie de Siigo, guardada en "Autorización Siigo")
// y carga del archivo diligenciado (202: el resultado llega por correo)
export default {
  base,
  types: () => call(() => http.get(`${base}/types`)),
  // withSiigo se evalúa fuera de callBlob() para conservar su mensaje cuando falta la cookie
  format: async (purchaseOrderTypeId) => {
    const payload = withSiigo(['cookie'], { purchase_order_type_id: purchaseOrderTypeId })
    return callBlob(() => http.post(`${base}/format`, payload, { responseType: 'blob' }), 'formato_orden_compra.xlsx')
  },
  upload: ({ file, email, referencia }) => call(() => http.post(`${base}/upload`, toFormData({ file, email, referencia }))),
}
