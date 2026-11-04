<script>
import { simpleConfig } from '@/utils/configHelpers'
// Campos, columnas y filtros del recurso (lo leen el controlador y las plantillas)
export const configuration = simpleConfig({ title: 'Cargos', singular: 'cargo', permission: 'organizational_structure.areas.positions', listKey: 'positions', optionKeys: ['areas'], extraFields: [{ key: 'area_id', label: 'Área', required: true, type: 'select', optionsKey: 'areas', first: true }], extraColumns: [{ key: 'area.name', label: 'Área' }], extraActions: [{ label: 'Permisos', permission: 'organizational_structure.areas.positions.authorization.assign', panel: 'permissions' }] })

export default {}
</script>
