<script>
// Campos, columnas y filtros del recurso (lo leen el controlador y las plantillas)
export const configuration = { title: 'Países', singular: 'país', listKey: 'countries', readonly: true, permission: '', formMode: 'modal', columns: [{ key: 'name', label: 'Nombre', sortable: true }, { key: 'iso2', label: 'ISO2' }, { key: 'phone_code', label: 'Indicativo' }, { key: 'region', label: 'Región', value: (r) => r.region?.name ?? '-' }], show: [{ label: 'Nombre', value: (e) => e.name }, { label: 'ISO2', value: (e) => e.iso2 }, { label: 'ISO3', value: (e) => e.iso3 }, { label: 'Indicativo', value: (e) => e.phone_code }, { label: 'Moneda', value: (e) => e.currency_name }, { label: 'Nacionalidad', value: (e) => e.nationality }, { label: 'Región', value: (e) => e.region?.name }], fields: [] }

export default {}
</script>
