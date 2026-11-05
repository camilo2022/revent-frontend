<script>
import { simpleConfig, codeField, codeColumn } from '@/utils/configHelpers'
// Campos, columnas y filtros del recurso (lo leen el controlador y las plantillas)
export const configuration = simpleConfig({ title: 'Subcategorías', singular: 'subcategoría', permission: 'categorization.categories.subcategories', listKey: 'subcategories', descUpper: false, extraFields: [codeField, { key: 'category_id', label: 'Categoría', required: true, type: 'select', optionsKey: 'categories', first: true }], extraColumns: [{ key: 'category.name', label: 'Categoría', first: true }, codeColumn], optionKeys: ['categories'] })

// Subcategorías dentro de una categoría: la categoría va fija, no se elige
export const categoryConfiguration = {
  ...configuration, optionKeys: [],
  fields: configuration.fields.filter((f) => f.key !== 'category_id'),
  columns: configuration.columns.filter((c) => c.key !== 'category.name'),
}

export default {}
</script>
