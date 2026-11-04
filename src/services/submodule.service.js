import api from '@/API/api'
import { getConfig } from '@/axiosConfig'
import { call, makeCrud } from './crud'

const base = '/navegation/submodules'

// La lista pide el módulo en la ruta: all({ module_id, ...filtros })
export const submoduleService = {
  ...makeCrud(base),
  all: ({ module_id, ...params }) => call(() => api.get(`${base}/all/${module_id}`, getConfig(params))),
}
