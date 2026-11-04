<script>
// Auditoría: solo lectura; la API ordena únicamente por created_at y event
export const events = { created: 'Creado', updated: 'Actualizado', deleted: 'Eliminado', restored: 'Restaurado', attach: 'Asociado', detach: 'Desasociado', sync: 'Sincronizado' }

export const configuration = {
  title: 'Auditoría', singular: 'registro', permission: 'audits', listKey: 'audits', readonly: true, show: true, customShow: true,
  sort: { column: 'created_at', dir: 'desc' }, noSearch: true, valueFilters: { user_id: '', event: '', start_date: '', end_date: '' },
  columns: [
    { key: 'created_at', label: 'Fecha', sortable: true },
    { key: 'user', label: 'Usuario', value: (r) => r.user?.username ?? '-' },
    { key: 'event', label: 'Evento', sortable: true, value: (r) => events[r.event] ?? r.event },
    { key: 'auditable_name', label: 'Modelo', value: (r) => r.auditable_name ?? r.auditable_type },
    { key: 'ip_address', label: 'IP' },
  ],
  fields: [],
}

export default {}
</script>
