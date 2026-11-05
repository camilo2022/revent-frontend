<script>
import { contactFields } from '@/utils/configHelpers'
// Campos, columnas y filtros del recurso (lo leen el controlador y las plantillas)
export const configuration = {
  title: 'Tiendas', singular: 'tienda', permission: 'stores', listKey: 'stores', withTrashed: true, formMode: 'page',
  noSearch: true, // la búsqueda de tiendas falla hoy en la API
  columns: [
    { key: 'code', label: 'Código', sortable: true }, { key: 'name', label: 'Nombre', sortable: true },
    { key: 'address', label: 'Dirección' }, { key: 'location', label: 'Ubicación', value: (r) => r.location?.name ?? '-' },
  ],
  fields: [
    { key: 'code', label: 'Código', required: true, maxlength: 2 },
    { key: 'name', label: 'Nombre', required: true, maxlength: 100 },
    contactFields[0], contactFields[1], contactFields[2],
  ],
  show: [
    { label: 'Código', value: (e) => e.code }, { label: 'Nombre', value: (e) => e.name },
    { label: 'Ubicación', value: (e) => e.location?.name }, { label: 'Dirección', value: (e) => e.address }, { label: 'Barrio', value: (e) => e.neighborhood },
  ],
}

export default {}
</script>
