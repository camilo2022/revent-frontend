<script>
// Campos, columnas y filtros del recurso (lo leen el controlador y las plantillas)
export const configuration = {
  title: 'Colecciones', singular: 'colección', permission: 'collections', listKey: 'collections', withTrashed: true, formMode: 'modal',
  fields: [
    { key: 'name', label: 'Nombre', required: true, upper: true, maxlength: 60 },
    { key: 'description', label: 'Descripción', type: 'textarea', maxlength: 255 },
    // Año y código viajan dentro de `settings` (igual que el código de Colores y Tallas)
    { key: 'settings.year', label: 'Año', required: true, maxlength: 2, hint: 'Los dos últimos dígitos del año. Ej. 26' },
    { key: 'settings.code', label: 'Código', required: true, maxlength: 1, hint: 'Número de la colección dentro del año. Ej. 5' },
  ],
  columns: [
    { key: 'name', label: 'Nombre' },
    { key: 'year', label: 'Año', value: (e) => e.year ?? e.settings?.year },
    { key: 'code', label: 'Código', value: (e) => e.code ?? e.settings?.code },
    { key: 'product_prefix', label: 'Prefijo de producto' }, { key: 'next_code', label: 'Próximo código' },
  ],
  show: [
    { label: 'Nombre', value: (e) => e.name }, { label: 'Descripción', value: (e) => e.description },
    { label: 'Año', value: (e) => e.year ?? e.settings?.year }, { label: 'Código', value: (e) => e.code ?? e.settings?.code },
    { label: 'Prefijo de producto', value: (e) => e.product_prefix }, { label: 'Próximo código', value: (e) => e.next_code },
  ],
}

export default {}
</script>
