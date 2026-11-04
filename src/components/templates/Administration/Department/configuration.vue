<script>
// Campos, columnas y filtros del recurso (lo leen el controlador y las plantillas)
export const configuration = { title: 'Departamentos', singular: 'departamento', listKey: 'departments', readonly: true, permission: '', formMode: 'modal', columns: [{ key: 'name', label: 'Nombre', sortable: true }, { key: 'state_code', label: 'Código' }, { key: 'type', label: 'Tipo' }, { key: 'country', label: 'País', value: (r) => r.country?.name ?? '-' }], show: [{ label: 'Nombre', value: (e) => e.name }, { label: 'Código', value: (e) => e.state_code }, { label: 'Tipo', value: (e) => e.type }, { label: 'País', value: (e) => e.country?.name }], fields: [] }

export default {}
</script>
