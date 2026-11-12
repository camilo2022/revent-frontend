import http from '@/config/http'
import { call } from '../BaseService'

const base = '/integration/sync_unico'

// Sincronización de ventas de Siigo con Único: historial de ejecuciones y lanzamiento manual
export default {
  base,
  runs: () => call(() => http.get(`${base}/runs`)),
  run: (body) => call(() => http.post(`${base}/run`, body)),
}
