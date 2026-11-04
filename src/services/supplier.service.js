import { makeCrud } from './crud'

// Solo se usa la lista para elegir proveedor
export const supplierService = makeCrud('/suppliers')
