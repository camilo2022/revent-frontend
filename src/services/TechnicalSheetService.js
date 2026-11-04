import http from '@/config/http'
import { call, createService } from './BaseService'

const base = '/technical_sheets'

export default {
  ...createService(base),
  reviewed: (id) => call(() => http.patch(`${base}/reviewed/${id}`, {})),
  approved: (id) => call(() => http.patch(`${base}/approved/${id}`, {})),
  canceled: (id) => call(() => http.patch(`${base}/canceled/${id}`, {})),
}
