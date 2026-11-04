<script>
import { money } from '@/utils/format'
// Productos: la lista usa la plantilla genérica; crear/editar/ver son plantillas propias
export const configuration = {
  title: 'Productos', singular: 'producto', permission: 'products', listKey: 'products', customForm: true, customShow: true,
  show: true, noDelete: true, optionKeys: ['collections'], valueFilters: { collection_id: '' },
  columns: [
    { key: 'code', label: 'Código', sortable: true },
    { key: 'name', label: 'Nombre', sortable: true },
    { key: 'collection', label: 'Colección', value: (r) => r.collection?.name ?? '-' },
    { key: 'price', label: 'Precio', sortable: true, value: (r) => money(r.price) },
    { key: 'technical_sheet', label: 'Ficha técnica', type: 'status', value: (r) => r.technical_sheet?.status ?? 'Sin ficha' },
  ],
  fields: [],
}

export default {}
</script>
