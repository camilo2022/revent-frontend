import CountryService from '@/services/CountryService'
import { date } from './format'

// Piezas compartidas por los configuration.vue de cada recurso.
// Campos: type text|textarea|date|email|password|select|remote|location|file; required marca el asterisco rojo.

export const personName = (p) => `${p?.names ?? ''} ${p?.last_names ?? ''}`.trim() || '-'
// Documento con el código del tipo (CC 1002003) en vez del nombre completo
export const documentLabel = (r) => `${r?.document_type?.settings?.code ?? r?.document_type?.name ?? ''} ${r?.document ?? ''}`.trim()
export const personLabel = (p) => `${p.names ?? ''} ${p.last_names ?? ''} (${p.document ?? ''})`.trim()
export const countryLabel = (c) => `${c.name}${c.phone_code ? ` (+${c.phone_code})` : ''}`
export const yesNo = (v) => (v ? 'Sí' : 'No')

// Catálogo simple (nombre + descripción + extras). `upper` sigue la regla `uppercase` del backend
export function simpleConfig({
  title, singular, permission, listKey, nameUpper = true, descUpper = true,
  extraFields = [], extraColumns = [], optionKeys = [], extraActions, ...rest
}) {
  return {
    title, singular, permission, listKey, withTrashed: true, formMode: 'modal', optionKeys, extraActions,
    fields: [
      ...extraFields.filter((f) => f.first),
      { key: 'name', label: 'Nombre', required: true, maxlength: 50, upper: nameUpper },
      { key: 'description', label: 'Descripción', required: true, type: 'textarea', maxlength: 255, upper: descUpper },
      ...extraFields.filter((f) => !f.first),
    ],
    columns: [
      ...extraColumns.filter((c) => c.first),
      { key: 'name', label: 'Nombre', sortable: true },
      ...extraColumns.filter((c) => !c.first),
      { key: 'description', label: 'Descripción' },
    ],
    show: [
      { label: 'Nombre', value: (e) => e.name },
      { label: 'Descripción', value: (e) => e.description },
    ],
    ...rest,
  }
}

export const codeField = { key: 'settings.code', label: 'Código', required: true, maxlength: 2, upper: true }
export const codeColumn = { key: 'settings.code', label: 'Código' }

// Campos de contacto que comparten personas y proveedores
export const contactFields = [
  { key: 'location', type: 'location', typeKey: 'location_type', idKey: 'location_id', label: 'Ubicación', required: true, initialLabel: (e) => e?.location?.name },
  { key: 'address', label: 'Dirección', required: true, maxlength: 255 },
  { key: 'neighborhood', label: 'Barrio', required: true, maxlength: 255 },
  { key: 'phone_country_id', type: 'remote', service: CountryService, labelFn: countryLabel, label: 'País del teléfono', required: true, initialLabel: (e) => e?.phone_country?.name },
  { key: 'phone', label: 'Teléfono', required: true, maxlength: 10 },
  { key: 'email', type: 'email', label: 'Correo', required: true, maxlength: 255 },
]
export const documentFields = [
  { key: 'document_type_id', type: 'select', optionsKey: 'document_types', label: 'Tipo de documento', required: true },
  { key: 'document', label: 'Documento', required: true, maxlength: 14 },
]
export const contactShow = [
  { label: 'Ubicación', value: (e) => e.location?.name },
  { label: 'Dirección', value: (e) => e.address },
  { label: 'Barrio', value: (e) => e.neighborhood },
  { label: 'Teléfono', value: (e) => `${e.phone_country?.phone_code ? `+${e.phone_country.phone_code} ` : ''}${e.phone ?? ''}` },
  { label: 'Correo', value: (e) => e.email },
]

export { date }
