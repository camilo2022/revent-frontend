<script>
import { simpleConfig } from '@/utils/configHelpers'
// Campos, columnas y filtros del recurso (lo leen el controlador y las plantillas)
export const configuration = simpleConfig({ title: 'Fondos de pensión', singular: 'fondo de pensión', permission: 'pension_funds', listKey: 'pension_funds', nameUpper: false })

export default {}
</script>
