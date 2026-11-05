<script>
import { date } from '@/utils/format'
// Órdenes de producción
export const configuration = {
  title: 'Órdenes de producción', singular: 'orden', permission: 'production_orders', listKey: 'production_orders', customForm: true, customShow: true,
  show: true, noDelete: true,
  columns: [
    { key: 'consecutive', label: 'Consecutivo', sortable: true },
    { key: 'supplier', label: 'Proveedor', value: (r) => r.supplier?.trade_name || r.supplier?.legal_name || '-' },
    { key: 'product', label: 'Producto', value: (r) => `${r.technical_sheet?.product?.code ?? ''} · ${r.technical_sheet?.product?.name ?? ''}` },
    { key: 'status', label: 'Estado', sortable: true, type: 'status' },
    { key: 'total_pairs', label: 'Pares' },
    { key: 'stores_count', label: 'Tiendas' },
    { key: 'colors_count', label: 'Colores' },
    { key: 'due_date', label: 'Vence', sortable: true, value: (r) => date(r.due_date) },
  ],
  statuses: [['Pendiente', 'Pendiente'], ['Aprobado', 'Aprobado'], ['Cancelado', 'Cancelado']],
  canEditRow: (r) => r.status === 'Pendiente',
  fields: [],
}

export default {}
</script>
