<script>
import { simpleConfig, codeField, codeColumn } from '@/utils/configHelpers'
// Campos, columnas y filtros del recurso (lo leen el controlador y las plantillas)
export const configuration = simpleConfig({ title: 'Colores', singular: 'color', permission: 'colors', listKey: 'colors', extraFields: [codeField], extraColumns: [codeColumn], descUpper: false })

export default {}
</script>
