<script>
// Campos, columnas y filtros del recurso (lo leen el controlador y las plantillas)
export const configuration = { title: 'Continentes', singular: 'continente', listKey: 'continents', readonly: true, permission: '', formMode: 'modal', columns: [{ key: 'name', label: 'Nombre', sortable: true }], show: [{ label: 'Nombre', value: (e) => e.name }], fields: [] }

export default {}
</script>
