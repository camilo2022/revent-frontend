<script>
import { simpleConfig, codeField, codeColumn } from '@/utils/configHelpers'
// Campos, columnas y filtros del recurso (lo leen el controlador y las plantillas)
export const configuration = simpleConfig({ title: 'Tallas', singular: 'talla', permission: 'sizes', listKey: 'sizes', descUpper: false, extraFields: [codeField, { key: 'icon.file', type: 'file', label: 'Ícono', requiredOnCreate: true, urlFrom: 'icon' }], extraColumns: [codeColumn] })

export default {}
</script>
