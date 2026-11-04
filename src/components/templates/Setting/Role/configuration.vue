<script>
// Campos, columnas y filtros del recurso (lo leen el controlador y las plantillas)
export const configuration = {
  title: 'Roles', singular: 'rol', permission: 'authorization.roles', listKey: 'roles', formMode: 'modal', noDelete: true,
  columns: [
    { key: 'name', label: 'Nombre', sortable: true }, { key: 'title', label: 'Título', sortable: true },
    { key: 'description', label: 'Descripción' }, { key: 'permissions', label: 'Permisos', value: (r) => (r.permissions ?? []).length },
  ],
  fields: [
    { key: 'name', label: 'Nombre (minúsculas y _)', required: true, maxlength: 80 },
    { key: 'title', label: 'Título', required: true, maxlength: 100 },
    { key: 'description', label: 'Descripción', required: true, type: 'textarea', maxlength: 255 },
  ],
  show: [
    { label: 'Nombre', value: (e) => e.name }, { label: 'Título', value: (e) => e.title }, { label: 'Descripción', value: (e) => e.description },
    { label: 'Permisos del rol', type: 'list', value: (e) => (e.permissions ?? []).map((p) => `${p.title} (${p.name})`) },
  ],
}

export default {}
</script>
