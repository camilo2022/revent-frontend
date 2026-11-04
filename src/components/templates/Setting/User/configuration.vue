<script>
import EmployeeService from '@/services/EmployeeService'
import { personName, date } from '@/utils/configHelpers'
// Campos, columnas y filtros del recurso (lo leen el controlador y las plantillas)
export const configuration = {
  title: 'Usuarios', singular: 'usuario', permission: 'users', listKey: 'users', withTrashed: true, formMode: 'page',
  extraActions: [{ label: 'Permisos', permission: 'users.authorization.assign', panel: 'permissions' }],
  columns: [
    { key: 'username', label: 'Usuario' }, // la API no ordena por username
    { key: 'employee_id', label: 'Empleado', value: (r) => personName(r.employee?.person) },
    { key: 'roles', label: 'Roles', value: (r) => (r.roles ?? []).map((x) => x.title ?? x.name).join(', ') || '-' },
    { key: 'created_at', label: 'Creado', value: (r) => date(r.created_at) },
  ],
  fields: [
    { key: 'employee_id', type: 'remote', service: EmployeeService, listKey: 'employees', params: { with_trashed: 0 }, labelFn: (e) => `${personName(e.person)} - ${e.position?.name ?? ''}`, label: 'Empleado', required: true, initialLabel: (e) => (e?.employee ? personName(e.employee.person) : '') },
    { key: 'username', label: 'Usuario', required: true, maxlength: 40 },
    { key: 'password', type: 'password', label: 'Contraseña', requiredOnCreate: true, hint: 'Mínimo 8 caracteres con mayúscula, minúscula, número y un símbolo (@$!%*#?&._-). En edición, déjala vacía para no cambiarla.' },
    { key: 'password_confirmation', type: 'password', label: 'Confirmar contraseña', requiredOnCreate: true },
  ],
  show: [
    { label: 'Usuario', value: (e) => e.username }, { label: 'Empleado', value: (e) => personName(e.employee?.person) },
    { label: 'Roles', type: 'list', value: (e) => (e.roles ?? []).map((x) => x.title ?? x.name) },
    { label: 'Permisos asignados', value: (e) => (e.permissions ?? []).length },
  ],
}

export default {}
</script>
