import http from '@/config/http'
import { call, createService } from './BaseService'

const base = '/production_orders'

export default {
  ...createService(base),
  approved: (id) => call(() => http.patch(`${base}/approved/${id}`, {})),
  canceled: (id) => call(() => http.patch(`${base}/canceled/${id}`, {})),
}
