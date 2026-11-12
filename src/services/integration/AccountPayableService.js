import http from '@/config/http'
import { toFormData } from '@/utils/format'
import { call } from '../BaseService'

const base = '/integration/accounts_payable'

// Cuentas por pagar (Siigo). Una ruta por acción y un permiso por ruta: integration.accounts_payable.{acción}
// Pagos y anticipos viajan en multipart (llevan comprobante); la conciliación va en JSON.
export default {
  base,
  settings: () => call(() => http.get(`${base}/settings`)),
  providers: () => call(() => http.get(`${base}/providers`)),
  providersSync: () => call(() => http.post(`${base}/providers_sync`)),
  documents: (accountId, params = {}) => call(() => http.get(`${base}/documents/${accountId}`, { params })),
  payments: (accountId) => call(() => http.get(`${base}/payments/${accountId}`)),
  paymentsWeekly: (params = {}) => call(() => http.get(`${base}/payments_weekly`, { params })),
  paymentHtml: (acEntryId) => call(() => http.get(`${base}/payment_html/${acEntryId}`)),
  paymentStore: (body) => call(() => http.post(`${base}/payment`, toFormData(body))),
  advanceStore: (body) => call(() => http.post(`${base}/advance`, toFormData(body))),
  conciliationStore: (body) => call(() => http.post(`${base}/conciliation`, body)),
}
