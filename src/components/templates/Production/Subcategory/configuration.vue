<script>
import { simpleConfig, codeField, codeColumn } from '@/utils/configHelpers'
// Campos, columnas y filtros del recurso (lo leen el controlador y las plantillas)
export const configuration = simpleConfig({ title: 'Subcategorías', singular: 'subcategoría', permission: 'classification.subcategories', listKey: 'subcategories', descUpper: false, extraFields: [codeField], extraColumns: [codeColumn] })

export default {}
</script>
