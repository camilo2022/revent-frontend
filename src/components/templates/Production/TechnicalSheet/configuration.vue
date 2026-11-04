<script>
import { date } from '@/utils/format'
// Fichas técnicas: filtros por estado y producto (se dibujan en TechnicalSheet.vue)
export const configuration = {
  title: 'Fichas técnicas', singular: 'ficha técnica', permission: 'technical_sheets', listKey: 'technical_sheets', customForm: true, customShow: true,
  show: true, noDelete: true, optionKeys: ['products'], valueFilters: { status: '', product_id: '' },
  columns: [
    { key: 'product', label: 'Producto', value: (r) => `${r.product?.code ?? ''} · ${r.product?.name ?? ''}` },
    { key: 'status', label: 'Estado', sortable: true, type: 'status' },
    { key: 'trademark', label: 'Marca', value: (r) => r.trademark?.name ?? '-' },
    { key: 'created_at', label: 'Creada', sortable: true, value: (r) => date(r.created_at) },
  ],
  statuses: [['Pendiente', 'Pendiente'], ['En revision', 'En revisión'], ['Aprobado', 'Aprobado'], ['Cancelado', 'Cancelado']],
  // Se edita salvo cancelada (los cambios quedan en la auditoría)
  canEditRow: (r) => r.status !== 'Cancelado',
  fields: [],
}

export default {}
</script>
