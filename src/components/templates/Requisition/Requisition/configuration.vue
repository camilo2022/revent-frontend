<script>
import { date } from '@/utils/format'
import { useAuthStore } from '@/stores/authStore'

// Estados de una solicitud (mismos del backend)
export const STATUSES = { PENDING: 'Pendiente', IN_REVIEW: 'En revisión', APPROVED: 'Aprobado', IN_PROGRESS: 'En progreso', COMPLETED: 'Completado', REJECTED: 'Rechazado' }

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
  rowCan: (action, r) => ['update', 'delete', 'restore'].includes(action) ? r.user_created?.id === useAuthStore().user?.id && r.status === STATUSES.PENDING : true,
  columns: [
    { key: 'id', label: 'N°', sortable: true },
    { key: 'request_type', label: 'Tipo', value: (r) => r.request_type?.name ?? '-' },
    { key: 'relation', label: 'Para', value: relationText },
    { key: 'user_created', label: 'Creada por', value: (r) => r.user_created?.name ?? '-' },
    { key: 'date', label: 'Fecha', sortable: true, value: (r) => date(r.date) },
    { key: 'status', label: 'Estado', sortable: true, type: 'status' },
  ],
  fields: [],
}

export default {}
</script>
