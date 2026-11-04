<script>
import { simpleConfig } from '@/utils/configHelpers'
// Campos, columnas y filtros del recurso (lo leen el controlador y las plantillas)
export const configuration = simpleConfig({ title: 'Entidades de salud', singular: 'entidad de salud', permission: 'health_entities', listKey: 'health_entities' })

export default {}
</script>
