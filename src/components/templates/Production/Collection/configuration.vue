<script>
// Campos, columnas y filtros del recurso (lo leen el controlador y las plantillas)
export const configuration = {
  title: 'Colecciones', singular: 'colección', permission: 'collections', listKey: 'collections', withTrashed: true, formMode: 'modal',
  fields: [
    { key: 'name', label: 'Nombre', required: true, upper: true, maxlength: 60 },
    { key: 'description', label: 'Descripción', type: 'textarea', maxlength: 255 },
    { key: 'year', label: 'Año (2 dígitos)', required: true, maxlength: 2, hint: 'Ej. 26' },
    { key: 'code', label: 'Código (1 dígito)', required: true, maxlength: 1, hint: 'Ej. 5' },
  ],
  columns: [
    { key: 'name', label: 'Nombre' }, { key: 'year', label: 'Año' }, { key: 'code', label: 'Código' },
    { key: 'product_prefix', label: 'Prefijo de producto' }, { key: 'next_code', label: 'Próximo código' },
  ],
  show: [
    { label: 'Nombre', value: (e) => e.name }, { label: 'Descripción', value: (e) => e.description },
    { label: 'Prefijo de producto', value: (e) => e.product_prefix }, { label: 'Próximo código', value: (e) => e.next_code },
  ],
}

export default {}
</script>
