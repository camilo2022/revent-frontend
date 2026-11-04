<script>
import { contactFields, documentFields, contactShow } from '@/utils/configHelpers'
// Campos, columnas y filtros del recurso (lo leen el controlador y las plantillas)
export const configuration = {
  title: 'Proveedores', singular: 'proveedor', permission: 'suppliers', listKey: 'suppliers', withTrashed: true, formMode: 'page',
  optionKeys: ['document_types', 'file_types'],
  columns: [
    { key: 'code', label: 'Código', sortable: true }, { key: 'legal_name', label: 'Razón social', sortable: true },
    { key: 'trade_name', label: 'Nombre comercial' }, { key: 'document', label: 'Documento' }, { key: 'email', label: 'Correo' },
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
    { label: 'Código', value: (e) => e.code }, { label: 'Razón social', value: (e) => e.legal_name },
    { label: 'Nombre comercial', value: (e) => e.trade_name },
    { label: 'Documento', value: (e) => `${e.document_type?.name ?? ''} ${e.document}` }, ...contactShow,
  ],
}

export default {}
</script>
