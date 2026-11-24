<script>
import { date } from '@/utils/format'
import { useAuthStore } from '@/stores/authStore'

// Estados de una solicitud (mismos del backend)
export const STATUSES = { pending: 'Pendiente', in_review: 'En revisión', approved: 'Aprobada', in_process: 'En proceso', completed: 'Completada', rejected: 'Rechazada' }

// Primer select dinámico con su valor (ej. la tienda), para verlo en el listado
const relationText = (r) => {
  const field = (r.fields ?? []).find((f) => f.type === 'selectdinamic' && r.data?.[f.field])
  if (!field) return '-'
  const value = r.data[field.field]
  return Array.isArray(value) ? value.map((v) => v.name).join(', ') : value.name
}

// Solicitudes: sin «ver todas» cada quien ve las suyas; el estado lo cambia quien gestiona (Show.vue)
export const configuration = {
  title: 'Solicitudes', singular: 'solicitud', permission: 'requisitions', listKey: 'requisitions', withTrashed: true,
  customForm: true, customShow: true, show: true,
  sort: { column: 'id', dir: 'desc' },
  valueFilters: { mine: '' },
  // Editar, anular y reactivar: solo quien la creó y mientras esté Pendiente (igual que el backend)
  rowCan: (action, r) => ['update', 'delete', 'restore'].includes(action) ? r.user_id === useAuthStore().user?.id && r.status === 'pending' : true,
  columns: [
    { key: 'id', label: 'N°', sortable: true },
    { key: 'request_type', label: 'Tipo', value: (r) => r.request_type?.name ?? '-' },
    { key: 'relation', label: 'Para', value: relationText },
    { key: 'user', label: 'Creada por', value: (r) => r.user?.name ?? '-' },
    { key: 'date', label: 'Fecha', sortable: true, value: (r) => date(r.date) },
    { key: 'status', label: 'Estado', sortable: true, type: 'status', value: (r) => r.status_label },
  ],
  fields: [],
}

export default {}
</script>
