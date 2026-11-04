<script>
import { contactFields, documentFields, contactShow, personName, yesNo, date } from '@/utils/configHelpers'
import { fileUrl } from '@/utils/format'
// Campos, columnas y filtros del recurso (lo leen el controlador y las plantillas)
export const configuration = {
  title: 'Personas', singular: 'persona', permission: 'people', listKey: 'people', withTrashed: true, formMode: 'page',
  filters: [{ key: 'with_employee', label: 'Solo con empleado' }],
  optionKeys: ['document_types', 'genders', 'blood_types', 'file_types'],
  columns: [
    { key: 'photo', label: 'Foto', type: 'photo' },
    { key: 'names', label: 'Nombre', sortable: true, value: personName },
    { key: 'document', label: 'Documento', sortable: true, value: (r) => `${r.document_type?.name ?? ''} ${r.document}`.trim() },
    { key: 'email', label: 'Correo' }, { key: 'phone', label: 'Teléfono' },
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
    { label: 'Género', value: (e) => e.gender?.name }, { label: 'Tipo de sangre', value: (e) => e.blood_type?.name },
    { label: 'Fecha de nacimiento', value: (e) => date(e.birth_date) },
    ...contactShow,
    { label: 'Empleado', value: (e) => yesNo(e.employee) },
  ],
}

export default {}
</script>
