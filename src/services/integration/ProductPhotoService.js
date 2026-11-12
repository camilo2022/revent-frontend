import http from '@/config/http'
import { call } from '../BaseService'
import { toFormData } from '@/utils/format'
import { formWithSiigo } from './IntegrationService'

const base = '/integration/product_photos'

// Fotos de producto. Todo se controla por permiso; el token de Siigo (guardado en "Autorización Siigo")
// solo viaja al subir desde el explorador, porque ahí es Siigo quien recibe la foto.
export default {
  base,
  search: (referencia) => call(() => http.get(`${base}/search`, { params: { referencia } })),
  upload: ({ referencia, photos }) => call(() => http.post(`${base}/upload`, toFormData({ referencia, photos }))),
  remove: ({ referencia, filename }) => call(() => http.delete(`${base}/delete`, { data: { referencia, filename } })),
  bulkUpload: ({ zip, zip_mode }) => call(() => http.post(`${base}/bulk_upload`, toFormData({ zip, zip_mode }))),
  explorer: (path = '') => call(() => http.get(`${base}/explorer`, { params: { path } })),
  explorerFolder: ({ path, name }) => call(() => http.post(`${base}/explorer/folder`, { path, name })),
  explorerUpload: ({ path, photos }) => call(() => http.post(`${base}/explorer/upload`, formWithSiigo(['token'], { path, photos }))),
  explorerDelete: ({ path, filename }) => call(() => http.delete(`${base}/explorer/delete`, { data: { path, filename } })),
}
