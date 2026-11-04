<script>
import { simpleConfig } from '@/utils/configHelpers'
// Campos, columnas y filtros del recurso (lo leen el controlador y las plantillas)
export const configuration = simpleConfig({ title: 'Tipos de archivo', singular: 'tipo de archivo', permission: 'file_types', listKey: 'file_types' })

export default {}
</script>
