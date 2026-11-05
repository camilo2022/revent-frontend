<script>
// Campos, columnas y filtros del recurso (lo leen el controlador y las plantillas)
export const configuration = {
  title: 'Módulos', singular: 'módulo', permission: 'navegation.modules', listKey: 'modules', withTrashed: true, formMode: 'modal',
  extraActions: [{ label: 'Submódulos', permission: 'navegation.modules.submodules.all', panel: 'submodules', sub: true }],
  columns: [{ key: 'name', label: 'Nombre', sortable: true }, { key: 'icon', label: 'Ícono', sortable: true }],
  fields: [
    { key: 'name', label: 'Nombre', required: true, maxlength: 18 },
    { key: 'icon', label: 'Ícono', required: true, maxlength: 40 },
  ],
  show: [
    { label: 'Nombre', value: (e) => e.name }, { label: 'Ícono', value: (e) => e.icon },
    { label: 'Submódulos', type: 'list', value: (e) => (e.submodules ?? []).map((s) => `${s.name} (${s.url})`) },
  ],
}

export default {}
</script>
