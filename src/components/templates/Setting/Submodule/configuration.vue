<script>
// Campos, columnas y filtros del recurso (lo leen el controlador y las plantillas)
export const configuration = {
  title: 'Submódulos', singular: 'submódulo', permission: 'navegation.modules.submodules', listKey: 'submodules', withTrashed: true, formMode: 'modal',
  optionKeys: ['permissions'],
  columns: [
    { key: 'name', label: 'Nombre', sortable: true }, { key: 'url', label: 'URL' }, { key: 'icon', label: 'Ícono', sortable: true },
    { key: 'permission', label: 'Permiso', value: (r) => r.permission?.name ?? '-' },
  ],
  fields: [
    { key: 'permission_id', type: 'select', optionsKey: 'permissions', optionLabel: (o) => `${o.title} (${o.name})`, label: 'Permiso', required: true },
    { key: 'name', label: 'Nombre', required: true, maxlength: 18 },
    { key: 'url', label: 'URL', required: true, maxlength: 40 },
    { key: 'icon', label: 'Ícono', required: true, maxlength: 40 },
  ],
  show: [
    { label: 'Nombre', value: (e) => e.name }, { label: 'URL', value: (e) => e.url }, { label: 'Ícono', value: (e) => e.icon },
    { label: 'Permiso', value: (e) => e.permission?.name }, { label: 'Módulo', value: (e) => e.module?.name },
  ],
}

export default {}
</script>
