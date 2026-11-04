<script>
import PersonService from '@/services/PersonService'
import { personName, personLabel, date } from '@/utils/configHelpers'
// Campos, columnas y filtros del recurso (lo leen el controlador y las plantillas)
export const configuration = {
  title: 'Empleados', singular: 'empleado', permission: 'employees', listKey: 'employees', withTrashed: true, formMode: 'page',
  filters: [{ key: 'with_user', label: 'Solo con usuario' }],
  optionKeys: ['positions', 'risk_managers', 'health_entities', 'pension_funds', 'compensation_funds'],
  columns: [
    { key: 'person_id', label: 'Persona', value: (r) => personName(r.person) },
    { key: 'position_id', label: 'Cargo', value: (r) => r.position?.name ?? '-' },
    { key: 'start_date', label: 'Ingreso', sortable: true, value: (r) => date(r.start_date) },
    { key: 'end_date', label: 'Retiro', sortable: true, value: (r) => date(r.end_date) },
    { key: 'user', label: 'Usuario', value: (r) => r.user?.username ?? '-' },
  ],
  fields: [
    { key: 'person_id', type: 'remote', service: PersonService, listKey: 'people', params: { with_trashed: 0 }, labelFn: personLabel, label: 'Persona', required: true, initialLabel: (e) => (e?.person ? personLabel(e.person) : '') },
    { key: 'position_id', type: 'select', optionsKey: 'positions', label: 'Cargo', required: true },
    { key: 'risk_manager_id', type: 'select', optionsKey: 'risk_managers', label: 'Administradora de riesgos', required: true },
    { key: 'health_entity_id', type: 'select', optionsKey: 'health_entities', label: 'Entidad de salud', required: true },
    { key: 'pension_fund_id', type: 'select', optionsKey: 'pension_funds', label: 'Fondo de pensión', required: true },
    { key: 'compensation_fund_id', type: 'select', optionsKey: 'compensation_funds', label: 'Caja de compensación', required: true },
    { key: 'start_date', type: 'date', label: 'Fecha de ingreso', required: true },
    { key: 'end_date', type: 'date', label: 'Fecha de retiro', hint: 'Opcional; debe ser posterior al ingreso' },
  ],
  show: [
    { label: 'Persona', value: (e) => personName(e.person) }, { label: 'Cargo', value: (e) => e.position?.name },
    { label: 'Administradora de riesgos', value: (e) => e.risk_manager?.name }, { label: 'Entidad de salud', value: (e) => e.health_entity?.name },
    { label: 'Fondo de pensión', value: (e) => e.pension_fund?.name }, { label: 'Caja de compensación', value: (e) => e.compensation_fund?.name },
    { label: 'Ingreso', value: (e) => date(e.start_date) }, { label: 'Retiro', value: (e) => date(e.end_date) }, { label: 'Usuario', value: (e) => e.user?.username },
  ],
}

export default {}
</script>
