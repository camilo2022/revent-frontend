<script>
import { simpleConfig } from '@/utils/configHelpers'
// Campos, columnas y filtros del recurso (lo leen el controlador y las plantillas)
export const configuration = simpleConfig({ title: 'Áreas', singular: 'área', permission: 'organizational_structure.areas', listKey: 'areas' })

export default {}
</script>
