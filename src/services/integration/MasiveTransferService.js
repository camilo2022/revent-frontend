import http from '@/config/http'
import { call, callBlob } from '../BaseService'
import { toFormData } from '@/utils/format'

const base = '/integration/masive_transfers'

// Traslados masivos: formato de Excel (se descarga) y carga del archivo (202: el resultado llega por correo)
export default {
  base,
  format: () => callBlob(() => http.get(`${base}/format`, { responseType: 'blob' }), 'formato_traslado.xlsx'),
  upload: ({ file, email }) => call(() => http.post(`${base}/upload`, toFormData({ file, email }))),
}
