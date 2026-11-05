import { reactive } from 'vue'
import ColorService from '@/services/ColorService'
import SizeService from '@/services/SizeService'
import TrademarkService from '@/services/TrademarkService'
import CollectionService from '@/services/CollectionService'
import CategoryService from '@/services/CategoryService'
import SupplierService from '@/services/SupplierService'
import StoreService from '@/services/StoreService'
import GenderService from '@/services/GenderService'
import BloodTypeService from '@/services/BloodTypeService'
import HealthEntityService from '@/services/HealthEntityService'
import PensionFundService from '@/services/PensionFundService'
import CompensationFundService from '@/services/CompensationFundService'
import RiskManagerService from '@/services/RiskManagerService'
import FileTypeService from '@/services/FileTypeService'
import PersonTypeService from '@/services/PersonTypeService'
import AreaService from '@/services/AreaService'
import PositionService from '@/services/PositionService'
import RoleService from '@/services/RoleService'
import ModuleService from '@/services/ModuleService'
import ProductService from '@/services/ProductService'
import { useAlertStore } from '@/stores/alertStore'
import { errorMessage } from '@/utils/format'

// Listas para los selects: la clave es la misma de la respuesta (sin per_page la API devuelve todo)
const catalog = { with_trashed: 0 }
const sources = {
  colors: [ColorService, catalog],
  sizes: [SizeService, catalog],
  trademarks: [TrademarkService, catalog],
  collections: [CollectionService, catalog],
  categories: [CategoryService, catalog],
  suppliers: [SupplierService, catalog],
  stores: [StoreService, catalog],
  genders: [GenderService, catalog],
  blood_types: [BloodTypeService, catalog],
  health_entities: [HealthEntityService, catalog],
  pension_funds: [PensionFundService, catalog],
  compensation_funds: [CompensationFundService, catalog],
  risk_managers: [RiskManagerService, catalog],
  file_types: [FileTypeService, catalog],
  person_types: [PersonTypeService, catalog],
  areas: [AreaService, catalog],
  positions: [PositionService, catalog],
  roles: [RoleService, {}],
  modules: [ModuleService, catalog],
  products: [ProductService, {}],
}

// Registros hijos: no tienen lista propia (siempre se consultan por el padre); salen de la lista del padre, que ya los trae
const children = {
  subcategories: ['categories', (c) => (c.subcategories ?? []).map((s) => ({ ...s, category: { id: c.id, name: c.name } }))],
  document_types: ['person_types', (t) => (t.document_types ?? []).map((d) => ({ ...d, person_type: { id: t.id, name: t.name } }))],
  permissions: ['roles', (r) => (r.permissions ?? []).map((p) => ({ ...p, role: { id: r.id, name: r.name, title: r.title } }))],
}

// Uso: const { options, loadOptions } = useOptions(); await loadOptions(['colors', 'sizes'])
export function useOptions() {
  const options = reactive(Object.fromEntries([...Object.keys(sources), ...Object.keys(children)].map((k) => [k, []])))

  const loadOptions = async (keys) => {
    try {
      await Promise.all(
        keys.map(async (key) => {
          if (children[key]) {
            const [parentKey, flatten] = children[key]
            const [service, params] = sources[parentKey]
            options[key] = ((await service.all(params)).data[parentKey] ?? []).flatMap(flatten)
            return
          }
          const [service, params] = sources[key]
          options[key] = (await service.all(params)).data[key] ?? []
        }),
      )
    } catch (error) {
      useAlertStore().error(`No se pudieron cargar las listas: ${errorMessage(error)}`)
    }
  }

  return { options, loadOptions }
}
