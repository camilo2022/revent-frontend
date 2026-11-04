<script>
import { simpleConfig, codeField, codeColumn } from '@/utils/configHelpers'
// Campos, columnas y filtros del recurso (lo leen el controlador y las plantillas)
export const configuration = simpleConfig({ title: 'Categorías', singular: 'categoría', permission: 'classification.categories', listKey: 'categories', descUpper: false, extraFields: [codeField], extraColumns: [codeColumn], extraActions: [{ label: 'Subcategorías', permission: 'classification.categories.subcategories.assign', panel: 'subcategories' }] })

export default {}
</script>
