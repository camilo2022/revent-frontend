<script>
import { simpleConfig, codeField, codeColumn } from '@/utils/configHelpers'
// Campos, columnas y filtros del recurso (lo leen el controlador y las plantillas)
export const configuration = simpleConfig({ title: 'Marcas', singular: 'marca', permission: 'trademarks', listKey: 'trademarks', descUpper: false, optionKeys: ['file_types'], extraFields: [codeField, { key: 'icon', type: 'file', label: 'Ícono (jpg o png, máx. 2 MB)', requiredOnCreate: true, urlFrom: 'icon' }, { key: 'file_type_id', type: 'select', optionsKey: 'file_types', label: 'Tipo de archivo del ícono', onlyWith: 'icon' }], extraColumns: [{ key: 'icon', label: 'Ícono', type: 'icon', first: true }, codeColumn] })

export default {}
</script>
