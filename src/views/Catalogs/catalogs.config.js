import { colorService } from '@/services/color.service'
import { sizeService } from '@/services/size.service'
import { trademarkService } from '@/services/trademark.service'
import { collectionService } from '@/services/collection.service'
import { genderService } from '@/services/gender.service'
import { bloodTypeService } from '@/services/bloodType.service'
import { healthEntityService } from '@/services/healthEntity.service'
import { pensionFundService } from '@/services/pensionFund.service'
import { compensationFundService } from '@/services/compensationFund.service'
import { riskManagerService } from '@/services/riskManager.service'
import { fileTypeService } from '@/services/fileType.service'
import { personTypeService } from '@/services/personType.service'
import { documentTypeService } from '@/services/documentType.service'
import { areaService } from '@/services/area.service'
import { positionService } from '@/services/position.service'
import { categoryService } from '@/services/category.service'
import { subcategoryService } from '@/services/subcategory.service'

// Un catálogo nuevo se agrega aquí y en el router (ver README)
// fields: campos del formulario (key admite 'settings.code'); columns: columnas de la tabla
const name = { key: 'name', label: 'Nombre', required: true, maxlength: 50, upper: true }
const description = { key: 'description', label: 'Descripción', type: 'textarea', required: true, maxlength: 255 }
const code = { key: 'settings.code', label: 'Código', required: true, maxlength: 2, upper: true }

// Catálogo simple: nombre + descripción (+ campos extra). `upper` sigue la regla `uppercase` del backend
const simple = (title, singular, permission, service, listKey, { nameUpper = true, descUpper = true, extraFields = [], extraColumns = [], extraActions } = {}) => ({
  title, singular, permission, service, listKey, withTrashed: true, extraActions,
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
})
const codeField = { key: 'settings.code', label: 'Código (2 letras)', required: true, maxlength: 2, upper: true }
const codeColumn = { key: 'settings.code', label: 'Código' }

export default {
  genders: simple('Géneros', 'género', 'genders', genderService, 'genders', { nameUpper: false, descUpper: false }),
  blood_types: simple('Tipos de sangre', 'tipo de sangre', 'blood_types', bloodTypeService, 'blood_types', { nameUpper: true }),
  health_entities: simple('Entidades de salud', 'entidad de salud', 'health_entities', healthEntityService, 'health_entities'),
  pension_funds: simple('Fondos de pensión', 'fondo de pensión', 'pension_funds', pensionFundService, 'pension_funds', { nameUpper: false }),
  compensation_funds: simple('Cajas de compensación', 'caja de compensación', 'compensation_funds', compensationFundService, 'compensation_funds'),
  risk_managers: simple('Administradoras de riesgos', 'administradora de riesgos', 'risk_managers', riskManagerService, 'risk_managers'),
  file_types: simple('Tipos de archivo', 'tipo de archivo', 'file_types', fileTypeService, 'file_types'),
  person_types: simple('Tipos de persona', 'tipo de persona', 'identification.person_types', personTypeService, 'person_types', {
    extraFields: [codeField], extraColumns: [codeColumn],
  }),
  document_types: simple('Tipos de documento', 'tipo de documento', 'identification.document_types', documentTypeService, 'document_types', {
    extraFields: [codeField, { key: 'person_type_id', from: 'person_type.id', label: 'Tipo de persona', required: true, type: 'select', optionsKey: 'person_types', first: true }],
    extraColumns: [codeColumn, { key: 'person_type.name', label: 'Tipo de persona' }],
  }),
  areas: simple('Áreas', 'área', 'organizational_structure.areas', areaService, 'areas'),
  positions: simple('Cargos', 'cargo', 'organizational_structure.areas.positions', positionService, 'positions', {
    extraFields: [{ key: 'area_id', from: 'area.id', label: 'Área', required: true, type: 'select', optionsKey: 'areas', first: true }],
    extraColumns: [{ key: 'area.name', label: 'Área' }],
    extraActions: [{ label: 'Permisos', permission: 'organizational_structure.areas.positions.authorization.assign', to: (row) => `/positions/${row.id}/permissions` }],
  }),
  categories: {
    ...simple('Categorías', 'categoría', 'classification.categories', categoryService, 'categories', {
      descUpper: false, extraFields: [codeField], extraColumns: [codeColumn],
      extraActions: [{ label: 'Subcategorías', permission: 'classification.categories.subcategories.assign', to: (row) => `/categories/${row.id}/subcategories` }],
    }),
  },
  subcategories: simple('Subcategorías', 'subcategoría', 'classification.subcategories', subcategoryService, 'subcategories', {
    descUpper: false, extraFields: [codeField], extraColumns: [codeColumn],
  }),

  colors: {
    title: 'Colores', singular: 'color', permission: 'colors',
    service: colorService, listKey: 'colors', withTrashed: true,
    fields: [{ ...name, upper: true }, description, code],
    columns: [
      { key: 'name', label: 'Nombre', sortable: true },
      { key: 'settings.code', label: 'Código' },
      { key: 'description', label: 'Descripción' },
    ],
  },
  sizes: {
    title: 'Tallas', singular: 'talla', permission: 'sizes',
    service: sizeService, listKey: 'sizes', withTrashed: true,
    fields: [name, description, code],
    columns: [
      { key: 'name', label: 'Nombre', sortable: true },
      { key: 'settings.code', label: 'Código' },
      { key: 'description', label: 'Descripción' },
    ],
  },
  trademarks: {
    title: 'Marcas', singular: 'marca', permission: 'trademarks',
    service: trademarkService, listKey: 'trademarks', withTrashed: true,
    fields: [name, description, code],
    columns: [
      { key: 'name', label: 'Nombre', sortable: true },
      { key: 'settings.code', label: 'Código' },
      { key: 'description', label: 'Descripción' },
    ],
  },
  collections: {
    title: 'Colecciones', singular: 'colección', permission: 'collections',
    service: collectionService, listKey: 'collections', withTrashed: true,
    fields: [
      { key: 'name', label: 'Nombre', required: true, upper: true },
      { key: 'description', label: 'Descripción', type: 'textarea', maxlength: 255 },
      { key: 'year', label: 'Año (2 dígitos)', required: true, maxlength: 2, hint: 'Ej. 26' },
      { key: 'code', label: 'Código (1 dígito)', required: true, maxlength: 1, hint: 'Ej. 5' },
    ],
    columns: [
      { key: 'name', label: 'Nombre' },
      { key: 'year', label: 'Año' },
      { key: 'code', label: 'Código' },
      { key: 'product_prefix', label: 'Prefijo de producto' },
      { key: 'next_code', label: 'Próximo código' },
    ],
  },
}
