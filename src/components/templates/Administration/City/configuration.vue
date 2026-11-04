<script>
// Campos, columnas y filtros del recurso (lo leen el controlador y las plantillas)
export const configuration = { title: 'Ciudades', singular: 'ciudad', listKey: 'cities', readonly: true, permission: '', formMode: 'modal', columns: [{ key: 'name', label: 'Nombre', sortable: true }, { key: 'department', label: 'Departamento', value: (r) => r.department?.name ?? '-' }], show: [{ label: 'Nombre', value: (e) => e.name }, { label: 'Departamento', value: (e) => e.department?.name }, { label: 'País', value: (e) => e.department?.country?.name }], fields: [] }

export default {}
</script>
