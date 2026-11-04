<script>
import { simpleConfig } from '@/utils/configHelpers'
// Campos, columnas y filtros del recurso (lo leen el controlador y las plantillas)
export const configuration = simpleConfig({ title: 'Cajas de compensación', singular: 'caja de compensación', permission: 'compensation_funds', listKey: 'compensation_funds' })

export default {}
</script>
