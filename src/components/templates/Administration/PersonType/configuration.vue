<script>
import { simpleConfig, codeField, codeColumn } from '@/utils/configHelpers'
// Campos, columnas y filtros del recurso (lo leen el controlador y las plantillas)
export const configuration = simpleConfig({ title: 'Tipos de persona', singular: 'tipo de persona', permission: 'identification.person_types', listKey: 'person_types', extraFields: [codeField], extraColumns: [codeColumn], extraActions: [{ label: 'Tipos de documento', permission: 'identification.person_types.document_types.all', panel: 'document_types', sub: true }] })

export default {}
</script>
