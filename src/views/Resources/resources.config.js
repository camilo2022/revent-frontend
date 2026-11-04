import { personService } from '@/services/person.service'
import { employeeService } from '@/services/employee.service'
import { userService } from '@/services/user.service'
import { supplierService } from '@/services/supplier.service'
import { storeService } from '@/services/store.service'
import { roleService } from '@/services/role.service'
import { permissionService } from '@/services/permission.service'
import { moduleService } from '@/services/module.service'
import { submoduleService } from '@/services/submodule.service'
import { continentService, regionService, countryService, departmentService, cityService } from '@/services/location.service'
import { date, fileUrl } from '@/utils/format'

// Recursos con página de lista, formulario y detalle (generic: ResourceList/Form/Show).
// Campos: type text|textarea|date|email|password|select|remote|location|file; required marca el asterisco rojo.
// Columnas: key (ruta con puntos) o value(row); type 'photo' muestra imagen.

const personLabel = (p) => `${p.names ?? ''} ${p.last_names ?? ''} (${p.document ?? ''})`.trim()
const personName = (p) => `${p?.names ?? ''} ${p?.last_names ?? ''}`.trim() || '-'
const countryLabel = (c) => `${c.name}${c.phone_code ? ` (+${c.phone_code})` : ''}`
const yesNo = (v) => (v ? 'Sí' : 'No')

// Campos de contacto que comparten personas y proveedores
const contactFields = [
  { key: 'location', type: 'location', typeKey: 'location_type', idKey: 'location_id', label: 'Ubicación', required: true, initialLabel: (e) => e?.location?.name },
  { key: 'address', label: 'Dirección', required: true, maxlength: 255 },
  { key: 'neighborhood', label: 'Barrio', required: true, maxlength: 255 },
  { key: 'phone_country_id', type: 'remote', service: countryService, labelFn: countryLabel, label: 'País del teléfono', required: true, initialLabel: (e) => e?.phone_country?.name },
  { key: 'phone', label: 'Teléfono (10 dígitos)', required: true, maxlength: 10 },
  { key: 'email', type: 'email', label: 'Correo', required: true, maxlength: 255 },
]
const documentFields = [
  { key: 'document_type_id', type: 'select', optionsKey: 'document_types', label: 'Tipo de documento', required: true },
  { key: 'document', label: 'Documento (5 a 14 dígitos)', required: true, maxlength: 14 },
]
const contactShow = [
  { label: 'Ubicación', value: (e) => e.location?.name },
  { label: 'Dirección', value: (e) => e.address },
  { label: 'Barrio', value: (e) => e.neighborhood },
  { label: 'Teléfono', value: (e) => `${e.phone_country?.phone_code ? `+${e.phone_country.phone_code} ` : ''}${e.phone ?? ''}` },
  { label: 'Correo', value: (e) => e.email },
]

export default {
  people: {
    title: 'Personas', singular: 'persona', route: '/people', permission: 'people', service: personService, listKey: 'people',
    withTrashed: true, filters: [{ key: 'with_employee', label: 'Solo con empleado' }],
    optionKeys: ['document_types', 'genders', 'blood_types', 'file_types'],
    columns: [
      { key: 'photo', label: 'Foto', type: 'photo' },
      { key: 'names', label: 'Nombre', sortable: true, value: personName },
      { key: 'document', label: 'Documento', sortable: true, value: (r) => `${r.document_type?.name ?? ''} ${r.document}`.trim() },
      { key: 'email', label: 'Correo' },
      { key: 'phone', label: 'Teléfono' },
    ],
    fields: [
      { key: 'names', label: 'Nombres', required: true },
      { key: 'last_names', label: 'Apellidos', required: true },
      ...documentFields,
      { key: 'gender_id', type: 'select', optionsKey: 'genders', label: 'Género', required: true },
      { key: 'birth_date', type: 'date', label: 'Fecha de nacimiento', required: true },
      { key: 'blood_type_id', type: 'select', optionsKey: 'blood_types', label: 'Tipo de sangre', required: true },
      ...contactFields,
      { key: 'photo', type: 'file', urlFrom: 'photo', label: 'Foto (jpg o png, máx. 2 MB)' },
      { key: 'photo_type_id', type: 'select', optionsKey: 'file_types', label: 'Tipo de archivo de la foto', onlyWith: 'photo' },
    ],
    show: [
      { label: 'Foto', type: 'photo', value: (e) => fileUrl(e.photo) },
      { label: 'Nombre', value: personName },
      { label: 'Documento', value: (e) => `${e.document_type?.name ?? ''} ${e.document}` },
      { label: 'Género', value: (e) => e.gender?.name },
      { label: 'Tipo de sangre', value: (e) => e.blood_type?.name },
      { label: 'Fecha de nacimiento', value: (e) => date(e.birth_date) },
      ...contactShow,
      { label: 'Empleado', value: (e) => yesNo(e.employee) },
    ],
  },

  employees: {
    title: 'Empleados', singular: 'empleado', route: '/employees', permission: 'employees', service: employeeService, listKey: 'employees',
    withTrashed: true, filters: [{ key: 'with_user', label: 'Solo con usuario' }],
    optionKeys: ['positions', 'risk_managers', 'health_entities', 'pension_funds', 'compensation_funds'],
    columns: [
      { key: 'person_id', label: 'Persona', value: (r) => personName(r.person) },
      { key: 'position_id', label: 'Cargo', value: (r) => r.position?.name ?? '-' },
      { key: 'start_date', label: 'Ingreso', sortable: true, value: (r) => date(r.start_date) },
      { key: 'end_date', label: 'Retiro', sortable: true, value: (r) => date(r.end_date) },
      { key: 'user', label: 'Usuario', value: (r) => r.user?.username ?? '-' },
    ],
    fields: [
      { key: 'person_id', type: 'remote', service: personService, listKey: 'people', params: { with_trashed: 0 }, labelFn: personLabel, label: 'Persona', required: true, initialLabel: (e) => (e?.person ? personLabel(e.person) : '') },
      { key: 'position_id', type: 'select', optionsKey: 'positions', label: 'Cargo', required: true },
      { key: 'risk_manager_id', type: 'select', optionsKey: 'risk_managers', label: 'Administradora de riesgos', required: true },
      { key: 'health_entity_id', type: 'select', optionsKey: 'health_entities', label: 'Entidad de salud', required: true },
      { key: 'pension_fund_id', type: 'select', optionsKey: 'pension_funds', label: 'Fondo de pensión', required: true },
      { key: 'compensation_fund_id', type: 'select', optionsKey: 'compensation_funds', label: 'Caja de compensación', required: true },
      { key: 'start_date', type: 'date', label: 'Fecha de ingreso', required: true },
      { key: 'end_date', type: 'date', label: 'Fecha de retiro', hint: 'Opcional; debe ser posterior al ingreso' },
    ],
    show: [
      { label: 'Persona', value: (e) => personName(e.person) },
      { label: 'Cargo', value: (e) => e.position?.name },
      { label: 'Administradora de riesgos', value: (e) => e.risk_manager?.name },
      { label: 'Entidad de salud', value: (e) => e.health_entity?.name },
      { label: 'Fondo de pensión', value: (e) => e.pension_fund?.name },
      { label: 'Caja de compensación', value: (e) => e.compensation_fund?.name },
      { label: 'Ingreso', value: (e) => date(e.start_date) },
      { label: 'Retiro', value: (e) => date(e.end_date) },
      { label: 'Usuario', value: (e) => e.user?.username },
    ],
  },

  users: {
    title: 'Usuarios', singular: 'usuario', route: '/users', permission: 'users', service: userService, listKey: 'users',
    withTrashed: true,
    extraActions: [{ label: 'Permisos', permission: 'users.authorization.assign', to: (row) => `/users/${row.id}/permissions` }],
    columns: [
      { key: 'username', label: 'Usuario', sortable: true },
      { key: 'employee_id', label: 'Empleado', value: (r) => personName(r.employee?.person) },
      { key: 'roles', label: 'Roles', value: (r) => (r.roles ?? []).map((x) => x.title ?? x.name).join(', ') || '-' },
      { key: 'created_at', label: 'Creado', value: (r) => date(r.created_at) },
    ],
    fields: [
      { key: 'employee_id', type: 'remote', service: employeeService, listKey: 'employees', params: { with_trashed: 0 }, labelFn: (e) => `${personName(e.person)} - ${e.position?.name ?? ''}`, label: 'Empleado', required: true, initialLabel: (e) => (e?.employee ? personName(e.employee.person) : '') },
      { key: 'username', label: 'Usuario', required: true, maxlength: 40 },
      { key: 'password', type: 'password', label: 'Contraseña', requiredOnCreate: true, hint: 'Mínimo 8 caracteres con mayúscula, minúscula, número y un símbolo (@$!%*#?&._-). En edición, déjala vacía para no cambiarla.' },
      { key: 'password_confirmation', type: 'password', label: 'Confirmar contraseña', requiredOnCreate: true },
    ],
    show: [
      { label: 'Usuario', value: (e) => e.username },
      { label: 'Empleado', value: (e) => personName(e.employee?.person) },
      { label: 'Roles', type: 'list', value: (e) => (e.roles ?? []).map((x) => x.title ?? x.name) },
      { label: 'Permisos asignados', value: (e) => (e.permissions ?? []).length },
    ],
  },

  suppliers: {
    title: 'Proveedores', singular: 'proveedor', route: '/suppliers', permission: 'suppliers', service: supplierService, listKey: 'suppliers',
    withTrashed: true, optionKeys: ['document_types', 'file_types'],
    columns: [
      { key: 'code', label: 'Código', sortable: true },
      { key: 'legal_name', label: 'Razón social', sortable: true },
      { key: 'trade_name', label: 'Nombre comercial' },
      { key: 'document', label: 'Documento' },
      { key: 'email', label: 'Correo' },
    ],
    fields: [
      { key: 'code', label: 'Código (2 caracteres)', required: true, maxlength: 2 },
      { key: 'legal_name', label: 'Razón social', required: true, maxlength: 100 },
      { key: 'trade_name', label: 'Nombre comercial', maxlength: 100 },
      ...documentFields,
      ...contactFields,
      { key: 'file', type: 'file', label: 'Archivo (jpg o png, máx. 2 MB)', requiredOnCreate: true },
      { key: 'file_type_id', type: 'select', optionsKey: 'file_types', label: 'Tipo de archivo', onlyWith: 'file' },
    ],
    show: [
      { label: 'Código', value: (e) => e.code },
      { label: 'Razón social', value: (e) => e.legal_name },
      { label: 'Nombre comercial', value: (e) => e.trade_name },
      { label: 'Documento', value: (e) => `${e.document_type?.name ?? ''} ${e.document}` },
      ...contactShow,
    ],
  },

  stores: {
    title: 'Tiendas', singular: 'tienda', route: '/stores', permission: 'stores', service: storeService, listKey: 'stores',
    withTrashed: true, noSearch: true, // la búsqueda de tiendas falla hoy en la API
    columns: [
      { key: 'code', label: 'Código', sortable: true },
      { key: 'name', label: 'Nombre', sortable: true },
      { key: 'address', label: 'Dirección' },
      { key: 'location', label: 'Ubicación', value: (r) => r.location?.name ?? '-' },
    ],
    fields: [
      { key: 'code', label: 'Código (2 caracteres)', required: true, maxlength: 2 },
      { key: 'name', label: 'Nombre', required: true, maxlength: 100 },
      contactFields[0], contactFields[1], contactFields[2],
    ],
    show: [
      { label: 'Código', value: (e) => e.code },
      { label: 'Nombre', value: (e) => e.name },
      { label: 'Ubicación', value: (e) => e.location?.name },
      { label: 'Dirección', value: (e) => e.address },
      { label: 'Barrio', value: (e) => e.neighborhood },
    ],
  },

  roles: {
    title: 'Roles', singular: 'rol', route: '/roles', permission: 'authorization.roles', service: roleService, listKey: 'roles', noDelete: true,
    columns: [
      { key: 'name', label: 'Nombre', sortable: true },
      { key: 'title', label: 'Título', sortable: true },
      { key: 'description', label: 'Descripción' },
      { key: 'permissions', label: 'Permisos', value: (r) => (r.permissions ?? []).length },
    ],
    fields: [
      { key: 'name', label: 'Nombre (minúsculas y _)', required: true, maxlength: 80 },
      { key: 'title', label: 'Título', required: true, maxlength: 100 },
      { key: 'description', label: 'Descripción', required: true, type: 'textarea', maxlength: 255 },
    ],
    show: [
      { label: 'Nombre', value: (e) => e.name },
      { label: 'Título', value: (e) => e.title },
      { label: 'Descripción', value: (e) => e.description },
      { label: 'Permisos del rol', type: 'list', value: (e) => (e.permissions ?? []).map((p) => `${p.title} (${p.name})`) },
    ],
  },

  permissions: {
    title: 'Permisos', singular: 'permiso', route: '/permissions', permission: 'authorization.permissions', service: permissionService, listKey: 'permissions', noDelete: true,
    optionKeys: ['roles'],
    columns: [
      { key: 'role', label: 'Rol', value: (r) => r.role?.title ?? r.role?.name ?? '-' },
      { key: 'name', label: 'Nombre', sortable: true },
      { key: 'title', label: 'Título', sortable: true },
      { key: 'description', label: 'Descripción' },
    ],
    fields: [
      { key: 'role_id', type: 'select', optionsKey: 'roles', optionLabel: (o) => o.title ?? o.name, label: 'Rol', required: true, from: 'role.id' },
      { key: 'name', label: 'Nombre (minúsculas, . y _)', required: true, maxlength: 80 },
      { key: 'title', label: 'Título', required: true, maxlength: 100 },
      { key: 'description', label: 'Descripción', required: true, type: 'textarea', maxlength: 255 },
    ],
    show: [
      { label: 'Rol', value: (e) => e.role?.title ?? e.role?.name },
      { label: 'Nombre', value: (e) => e.name },
      { label: 'Título', value: (e) => e.title },
      { label: 'Descripción', value: (e) => e.description },
    ],
  },

  modules: {
    title: 'Módulos', singular: 'módulo', route: '/modules', permission: 'navegation.modules', service: moduleService, listKey: 'modules', withTrashed: true,
    extraActions: [{ label: 'Submódulos', permission: 'navegation.modules.submodules.all', to: (row) => `/modules/${row.id}/submodules` }],
    columns: [
      { key: 'name', label: 'Nombre', sortable: true },
      { key: 'icon', label: 'Ícono', sortable: true },
    ],
    fields: [
      { key: 'name', label: 'Nombre (máx. 18 letras)', required: true, maxlength: 18 },
      { key: 'icon', label: 'Ícono (ej. FaUsers)', required: true, maxlength: 40 },
    ],
    show: [
      { label: 'Nombre', value: (e) => e.name },
      { label: 'Ícono', value: (e) => e.icon },
      { label: 'Submódulos', type: 'list', value: (e) => (e.submodules ?? []).map((s) => `${s.name} (${s.url})`) },
    ],
  },

  submodules: {
    title: 'Submódulos', singular: 'submódulo', permission: 'navegation.modules.submodules', service: submoduleService, listKey: 'submodules', withTrashed: true,
    route: (p) => `/modules/${p.moduleId}/submodules`,
    fixed: (p) => ({ module_id: p.moduleId }), // el módulo va en la ruta
    optionKeys: ['permissions'],
    columns: [
      { key: 'name', label: 'Nombre', sortable: true },
      { key: 'url', label: 'URL' },
      { key: 'icon', label: 'Ícono', sortable: true },
      { key: 'permission', label: 'Permiso', value: (r) => r.permission?.name ?? '-' },
    ],
    fields: [
      { key: 'permission_id', type: 'select', optionsKey: 'permissions', optionLabel: (o) => `${o.title} (${o.name})`, label: 'Permiso', required: true, from: 'permission.id' },
      { key: 'name', label: 'Nombre (máx. 18 letras)', required: true, maxlength: 18 },
      { key: 'url', label: 'URL (ej. /people)', required: true, maxlength: 40 },
      { key: 'icon', label: 'Ícono (ej. FaUsers)', required: true, maxlength: 40 },
    ],
    show: [
      { label: 'Nombre', value: (e) => e.name },
      { label: 'URL', value: (e) => e.url },
      { label: 'Ícono', value: (e) => e.icon },
      { label: 'Permiso', value: (e) => e.permission?.name },
      { label: 'Módulo', value: (e) => e.module?.name },
    ],
  },
}

// Ubicaciones: solo lectura, siempre paginadas (la API no filtra por padre)
const readonly = { readonly: true, permission: '' }
export const locations = {
  continents: { ...readonly, title: 'Continentes', singular: 'continente', route: '/locations/continents', service: continentService, listKey: 'continents',
    columns: [{ key: 'name', label: 'Nombre', sortable: true }],
    show: [{ label: 'Nombre', value: (e) => e.name }] },
  regions: { ...readonly, title: 'Regiones', singular: 'región', route: '/locations/regions', service: regionService, listKey: 'regions',
    columns: [{ key: 'name', label: 'Nombre', sortable: true }, { key: 'continent', label: 'Continente', value: (r) => r.continent?.name ?? '-' }],
    show: [{ label: 'Nombre', value: (e) => e.name }, { label: 'Continente', value: (e) => e.continent?.name }] },
  countries: { ...readonly, title: 'Países', singular: 'país', route: '/locations/countries', service: countryService, listKey: 'countries',
    columns: [{ key: 'name', label: 'Nombre', sortable: true }, { key: 'iso2', label: 'ISO2' }, { key: 'phone_code', label: 'Indicativo' }, { key: 'region', label: 'Región', value: (r) => r.region?.name ?? '-' }],
    show: [{ label: 'Nombre', value: (e) => e.name }, { label: 'ISO2', value: (e) => e.iso2 }, { label: 'ISO3', value: (e) => e.iso3 }, { label: 'Indicativo', value: (e) => e.phone_code }, { label: 'Moneda', value: (e) => e.currency_name }, { label: 'Nacionalidad', value: (e) => e.nationality }, { label: 'Región', value: (e) => e.region?.name }] },
  departments: { ...readonly, title: 'Departamentos', singular: 'departamento', route: '/locations/departments', service: departmentService, listKey: 'departments',
    columns: [{ key: 'name', label: 'Nombre', sortable: true }, { key: 'state_code', label: 'Código' }, { key: 'type', label: 'Tipo' }, { key: 'country', label: 'País', value: (r) => r.country?.name ?? '-' }],
    show: [{ label: 'Nombre', value: (e) => e.name }, { label: 'Código', value: (e) => e.state_code }, { label: 'Tipo', value: (e) => e.type }, { label: 'País', value: (e) => e.country?.name }] },
  cities: { ...readonly, title: 'Ciudades', singular: 'ciudad', route: '/locations/cities', service: cityService, listKey: 'cities',
    columns: [{ key: 'name', label: 'Nombre', sortable: true }, { key: 'department', label: 'Departamento', value: (r) => r.department?.name ?? '-' }],
    show: [{ label: 'Nombre', value: (e) => e.name }, { label: 'Departamento', value: (e) => e.department?.name }, { label: 'País', value: (e) => e.department?.country?.name }] },
}
