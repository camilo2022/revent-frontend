<script>
import { simpleConfig } from '@/utils/configHelpers'
// Campos, columnas y filtros del recurso (lo leen el controlador y las plantillas)
export const configuration = simpleConfig({ title: 'Administradoras de riesgos', singular: 'administradora de riesgos', permission: 'risk_managers', listKey: 'risk_managers' })

export default {}
</script>
