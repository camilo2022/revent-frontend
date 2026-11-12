import http from '@/config/http'
import { call } from '../BaseService'

// Comprueba con Siigo el token y/o la cookie cargados: { token: { valid, user }, cookie: { valid, user } }
export default {
  check: (body) => call(() => http.post('/integration/credentials/check', body)),
}
