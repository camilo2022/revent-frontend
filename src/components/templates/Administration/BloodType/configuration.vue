<script>
import { simpleConfig } from '@/utils/configHelpers'
// Campos, columnas y filtros del recurso (lo leen el controlador y las plantillas)
export const configuration = simpleConfig({ title: 'Tipos de sangre', singular: 'tipo de sangre', permission: 'blood_types', listKey: 'blood_types' })

export default {}
</script>
