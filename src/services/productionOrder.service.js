import api from '@/API/api'
import { getConfig } from '@/axiosConfig'
import { call, makeCrud } from './crud'

const base = '/production_orders'

export const productionOrderService = {
  ...makeCrud(base),
  approved: (id) => call(() => api.patch(`${base}/approved/${id}`, {}, getConfig())),
  canceled: (id) => call(() => api.patch(`${base}/canceled/${id}`, {}, getConfig())),
}
