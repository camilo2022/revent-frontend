<script>
// Campos, columnas y filtros del recurso (lo leen el controlador y las plantillas)
export const configuration = {
  title: 'Permisos', singular: 'permiso', permission: 'authorization.roles.permissions', listKey: 'permissions', formMode: 'modal', noDelete: true,
  optionKeys: ['roles'],
  columns: [
    { key: 'role', label: 'Rol', value: (r) => r.role?.title ?? r.role?.name ?? '-' },
    { key: 'name', label: 'Nombre', sortable: true }, { key: 'title', label: 'Título', sortable: true }, { key: 'description', label: 'Descripción' },
  ],
  fields: [
    { key: 'role_id', type: 'select', optionsKey: 'roles', optionLabel: (o) => o.title ?? o.name, label: 'Rol', required: true },
    { key: 'name', label: 'Nombre', required: true, maxlength: 80 },
    { key: 'title', label: 'Título', required: true, maxlength: 100 },
    { key: 'description', label: 'Descripción', required: true, type: 'textarea', maxlength: 255 },
  ],
  show: [
    { label: 'Rol', value: (e) => e.role?.title ?? e.role?.name }, { label: 'Nombre', value: (e) => e.name },
    { label: 'Título', value: (e) => e.title }, { label: 'Descripción', value: (e) => e.description },
  ],
}

// Permisos dentro de un rol: el rol va fijo, no se elige
export const roleConfiguration = {
  ...configuration, optionKeys: [],
  columns: configuration.columns.filter((c) => c.key !== 'role'),
  fields: configuration.fields.filter((f) => f.key !== 'role_id'),
}

export default {}
</script>
