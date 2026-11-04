import http from '@/config/http'
import { call } from './BaseService'

export default {
  login: (credentials) => call(() => http.post('/auth/login', credentials)),
  user: () => call(() => http.get('/auth/user')),
  logout: () => call(() => http.post('/auth/logout', {})),
}
