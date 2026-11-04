import api from '@/API/api'
import { getConfig } from '@/axiosConfig'
import { call } from './crud'

export const authService = {
  login: (credentials) => call(() => api.post('/auth/login', credentials)),
  user: () => call(() => api.get('/auth/user', getConfig())),
  logout: () => call(() => api.post('/auth/logout', {}, getConfig())),
}
