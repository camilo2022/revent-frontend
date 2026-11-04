<script>
import { simpleConfig } from '@/utils/configHelpers'
// Campos, columnas y filtros del recurso (lo leen el controlador y las plantillas)
export const configuration = simpleConfig({ title: 'Géneros', singular: 'género', permission: 'genders', listKey: 'genders', nameUpper: false, descUpper: false })

export default {}
</script>
