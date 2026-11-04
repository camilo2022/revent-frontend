<script>
import { simpleConfig, codeField, codeColumn } from '@/utils/configHelpers'
// Campos, columnas y filtros del recurso (lo leen el controlador y las plantillas)
export const configuration = simpleConfig({ title: 'Tipos de documento', singular: 'tipo de documento', permission: 'identification.document_types', listKey: 'document_types', optionKeys: ['person_types'], extraFields: [codeField, { key: 'person_type_id', label: 'Tipo de persona', required: true, type: 'select', optionsKey: 'person_types', first: true }], extraColumns: [codeColumn, { key: 'person_type.name', label: 'Tipo de persona' }] })

export default {}
</script>
