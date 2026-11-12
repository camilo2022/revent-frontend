<script>
import StoreService from '@/services/StoreService'
import { contactFields } from '@/utils/configHelpers'
import { listOf } from '@/utils/format'

// Bodegas de Siigo para el selector: la API las entrega todas juntas, aquí se pagina y se separan las bodegas de tránsito.
// Se consulta de nuevo al abrir el selector (página 1) para ver siempre cuáles ya están asignadas a otra tienda.
const warehousePicker = (transit) => {
  let cache = []
  return {
    all: async ({ page = 1, per_page = 20, search = '' } = {}) => {
      if (!cache.length || (Number(page) === 1 && !search)) cache = listOf(await StoreService.siigoWarehouses(), 'warehouses').filter((w) => !!w.is_transit === transit)
      const q = String(search).trim().toLowerCase()
      const found = q ? cache.filter((w) => `${w.name} ${w.id}`.toLowerCase().includes(q)) : cache
      return { data: found.slice((page - 1) * per_page, page * per_page) }
    },
  }
}
const warehouseLabel = (w) => `${w.name} (${w.id})${w.assigned_store_name ? ` · ya es de ${w.assigned_store_name}` : ''}`
const warehouseValue = (id) => (id ? `Bodega ${id}` : '-')
// Campos, columnas y filtros del recurso (lo leen el controlador y las plantillas)
export const configuration = {
  title: 'Tiendas', singular: 'tienda', permission: 'stores', listKey: 'stores', withTrashed: true, formMode: 'page',
  noSearch: true, // la búsqueda de tiendas falla hoy en la API
  columns: [
    { key: 'code', label: 'Código', sortable: true }, { key: 'name', label: 'Nombre', sortable: true },
    { key: 'address', label: 'Dirección' }, { key: 'location', label: 'Ubicación', value: (r) => r.location?.name ?? '-' },
    { key: 'siigo_warehouse_id', label: 'Bodega Siigo', value: (r) => warehouseValue(r.siigo_warehouse_id) },
    { key: 'siigo_transit_warehouse_id', label: 'Tránsito', value: (r) => warehouseValue(r.siigo_transit_warehouse_id) },
  ],
  fields: [
    { key: 'code', label: 'Código', required: true, maxlength: 5 },
    { key: 'name', label: 'Nombre', required: true, maxlength: 100 },
    contactFields[0], contactFields[1], contactFields[2],
    { key: 'email', label: 'Correo de notificaciones', type: 'email', maxlength: 255, hint: 'Opcional. A este correo llega copia de las recepciones de órdenes de compra de la tienda. Puede repetirse en varias tiendas.' },
    {
      key: 'siigo_warehouse_id', type: 'remote', service: warehousePicker(false), listKey: 'warehouses', params: {}, labelFn: warehouseLabel, label: 'Bodega de Siigo',
      hint: 'La bodega de Siigo que corresponde a esta tienda. Con ella el usuario asignado puede operar en esa bodega.',
      initialLabel: (e) => (e?.siigo_warehouse_id ? warehouseValue(e.siigo_warehouse_id) : ''),
    },
    {
      key: 'siigo_transit_warehouse_id', type: 'remote', service: warehousePicker(true), listKey: 'warehouses', params: {}, labelFn: warehouseLabel, label: 'Bodega de tránsito de Siigo',
      hint: 'Opcional: la bodega «TRANSITO» de esta tienda.',
      initialLabel: (e) => (e?.siigo_transit_warehouse_id ? warehouseValue(e.siigo_transit_warehouse_id) : ''),
    },
  ],
  show: [
    { label: 'Código', value: (e) => e.code }, { label: 'Nombre', value: (e) => e.name },
    { label: 'Ubicación', value: (e) => e.location?.name }, { label: 'Dirección', value: (e) => e.address }, { label: 'Barrio', value: (e) => e.neighborhood },
    { label: 'Correo de notificaciones', value: (e) => e.email || '-' },
    { label: 'Bodega Siigo', value: (e) => warehouseValue(e.siigo_warehouse_id) }, { label: 'Tránsito', value: (e) => warehouseValue(e.siigo_transit_warehouse_id) },
  ],
}

export default {}
</script>
