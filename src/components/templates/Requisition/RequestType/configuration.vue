<script>
// Tipos de solicitud: cada uno define los campos de su formulario (Form.vue)
export const configuration = {
  title: 'Tipos de solicitud', singular: 'tipo de solicitud', permission: 'request_types', listKey: 'request_types', withTrashed: true,
  customForm: true,
  columns: [
    { key: 'name', label: 'Nombre', sortable: true },
    { key: 'description', label: 'Descripción' },
    { key: 'fields_count', label: 'Campos' },
    { key: 'relations', label: 'Se relaciona con', value: (r) => [...new Set((r.settings?.form ?? []).filter((f) => f.type === 'selectdinamic').map((f) => MODEL_LABELS[f.model] ?? f.model))].join(', ') || '-' },
    { key: 'files', label: 'Archivos', value: (r) => ((r.settings?.form ?? []).some((f) => f.type === 'file') ? 'Sí' : 'No') },
  ],
  fields: [],
}

// Nombre de los modelos para la columna (el formulario los toma de la API)
const MODEL_LABELS = { stores: 'Tiendas', suppliers: 'Proveedores', areas: 'Áreas', categories: 'Categorías', trademarks: 'Marcas', collections: 'Colecciones', colors: 'Colores', sizes: 'Tallas', products: 'Productos' }

export default {}
</script>
