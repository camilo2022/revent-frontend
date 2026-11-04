import api from '@/API/api'
import { getConfig } from '@/axiosConfig'
import { call, makeCrud } from './crud'

const base = '/technical_sheets'

export const technicalSheetService = {
  ...makeCrud(base),
  reviewed: (id) => call(() => api.patch(`${base}/reviewed/${id}`, {}, getConfig())),
  approved: (id) => call(() => api.patch(`${base}/approved/${id}`, {}, getConfig())),
  canceled: (id) => call(() => api.patch(`${base}/canceled/${id}`, {}, getConfig())),
  version: (id) => call(() => api.post(`${base}/version/${id}`, {}, getConfig())),
}
