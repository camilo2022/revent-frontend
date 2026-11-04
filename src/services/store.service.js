import { makeCrud } from './crud'

// Solo se usa la lista para elegir tiendas
export const storeService = makeCrud('/stores')
