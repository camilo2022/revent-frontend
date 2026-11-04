import { colorService } from '@/services/color.service'
import { sizeService } from '@/services/size.service'
import { trademarkService } from '@/services/trademark.service'
import { collectionService } from '@/services/collection.service'

// Un catálogo nuevo se agrega aquí y en el router (ver README)
// fields: campos del formulario (key admite 'settings.code'); columns: columnas de la tabla
const name = { key: 'name', label: 'Nombre', required: true, maxlength: 50 }
const description = { key: 'description', label: 'Descripción', type: 'textarea' }
const code = { key: 'settings.code', label: 'Código', required: true, maxlength: 2, upper: true }

export default {
  colors: {
    title: 'Colores', singular: 'color', permission: 'colors',
    service: colorService, listKey: 'colors', withTrashed: true,
    fields: [{ ...name, upper: true }, description, code],
    columns: [
      { key: 'name', label: 'Nombre', sortable: true },
      { key: 'settings.code', label: 'Código' },
      { key: 'description', label: 'Descripción' },
    ],
  },
  sizes: {
    title: 'Tallas', singular: 'talla', permission: 'sizes',
    service: sizeService, listKey: 'sizes', withTrashed: true,
    fields: [name, description, code],
    columns: [
      { key: 'name', label: 'Nombre', sortable: true },
      { key: 'settings.code', label: 'Código' },
      { key: 'description', label: 'Descripción' },
    ],
  },
  trademarks: {
    title: 'Marcas', singular: 'marca', permission: 'trademarks',
    service: trademarkService, listKey: 'trademarks', withTrashed: true,
    fields: [name, description, code],
    columns: [
      { key: 'name', label: 'Nombre', sortable: true },
      { key: 'settings.code', label: 'Código' },
      { key: 'description', label: 'Descripción' },
    ],
  },
  collections: {
    title: 'Colecciones', singular: 'colección', permission: 'collections',
    service: collectionService, listKey: 'collections', withTrashed: true,
    fields: [
      { key: 'name', label: 'Nombre', required: true },
      description,
      { key: 'year', label: 'Año (2 dígitos)', required: true, maxlength: 2, hint: 'Ej. 26' },
      { key: 'code', label: 'Código (1 dígito)', required: true, maxlength: 1, hint: 'Ej. 5' },
    ],
    columns: [
      { key: 'name', label: 'Nombre' },
      { key: 'year', label: 'Año' },
      { key: 'code', label: 'Código' },
      { key: 'product_prefix', label: 'Prefijo de producto' },
      { key: 'next_code', label: 'Próximo código' },
    ],
  },
}
