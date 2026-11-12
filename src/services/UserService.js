import http from '@/config/http'
import { assignService, call, createService } from './BaseService'

const base = '/users'

// Usuarios; `stores` asigna o quita las tiendas (bodegas) en las que el usuario puede operar
export default {
  ...createService(base),
  ...assignService('/users/authorization'),
  stores: {
    all: (id) => call(() => http.get(`${base}/stores/all/${id}`)),
    assign: (id, data) => call(() => http.post(`${base}/stores/assign/${id}`, data)),
    remove: (id, data) => call(() => http.post(`${base}/stores/remove/${id}`, data)),
  },
}
