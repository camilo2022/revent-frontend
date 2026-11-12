import { useIntegrationStore } from '@/stores/integrationStore'
import { toFormData } from '@/utils/format'
import { KINDS } from '@/config/integration'

// Adjunta a la petición el token y/o la cookie de Siigo guardados en "Autorización Siigo".
// Si falta o venció alguna lanza el error sin llamar a la API (mismo formato que los errores de la API).
export function withSiigo(kinds, body = {}) {
  const store = useIntegrationStore()
  const need = store.needs(kinds)
  if (!need.ready) {
    const names = kinds.filter((k) => !store.usable(k)).map((k) => KINDS[k].label)
    throw { message: `Carga tu ${names.join(' y tu ')} en Autorización Siigo.` }
  }
  return { ...body, ...store.payload(kinds) }
}

// Igual que withSiigo pero devuelve FormData (subidas de archivos)
export const formWithSiigo = (kinds, body = {}) => toFormData(withSiigo(kinds, body))
