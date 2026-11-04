<script>
// Campos, columnas y filtros del recurso (lo leen el controlador y las plantillas)
export const configuration = { title: 'Regiones', singular: 'región', listKey: 'regions', readonly: true, permission: '', formMode: 'modal', columns: [{ key: 'name', label: 'Nombre', sortable: true }, { key: 'continent', label: 'Continente', value: (r) => r.continent?.name ?? '-' }], show: [{ label: 'Nombre', value: (e) => e.name }, { label: 'Continente', value: (e) => e.continent?.name }], fields: [] }

export default {}
</script>
