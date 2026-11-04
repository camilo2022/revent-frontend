import { reactive } from 'vue'
import Swal from 'sweetalert2'
import { colorService } from '@/services/color.service'
import { sizeService } from '@/services/size.service'
import { trademarkService } from '@/services/trademark.service'
import { collectionService } from '@/services/collection.service'
import { categoryService } from '@/services/category.service'
import { subcategoryService } from '@/services/subcategory.service'
import { supplierService } from '@/services/supplier.service'
import { storeService } from '@/services/store.service'
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
import { roleService } from '@/services/role.service'
import { permissionService } from '@/services/permission.service'
import { moduleService } from '@/services/module.service'
import { errorMessage } from '@/utils/format'

// Origen de cada lista para llenar selects (sin per_page la API devuelve todo)
const sources = {
  colors: [colorService, { with_trashed: 0 }],
  sizes: [sizeService, { with_trashed: 0 }],
  trademarks: [trademarkService, { with_trashed: 0 }],
  collections: [collectionService, { with_trashed: 0 }],
  categories: [categoryService, { with_trashed: 0 }],
  subcategories: [subcategoryService, { with_trashed: 0 }],
  suppliers: [supplierService, { with_trashed: 0 }],
  stores: [storeService, { with_trashed: 0 }],
  genders: [genderService, { with_trashed: 0 }],
  blood_types: [bloodTypeService, { with_trashed: 0 }],
  health_entities: [healthEntityService, { with_trashed: 0 }],
  pension_funds: [pensionFundService, { with_trashed: 0 }],
  compensation_funds: [compensationFundService, { with_trashed: 0 }],
  risk_managers: [riskManagerService, { with_trashed: 0 }],
  file_types: [fileTypeService, { with_trashed: 0 }],
  person_types: [personTypeService, { with_trashed: 0 }],
  document_types: [documentTypeService, { with_trashed: 0 }],
  areas: [areaService, { with_trashed: 0 }],
  positions: [positionService, { with_trashed: 0 }],
  roles: [roleService, {}],
  permissions: [permissionService, {}],
  modules: [moduleService, { with_trashed: 0 }],
}

// Uso: const { options, loadOptions } = useOptions(); await loadOptions(['colors', 'sizes'])
export function useOptions() {
  const options = reactive(Object.fromEntries(Object.keys(sources).map((k) => [k, []])))

  const loadOptions = async (keys) => {
    try {
      await Promise.all(
        keys.map(async (key) => {
          const [service, params] = sources[key]
          const res = await service.all(params)
          options[key] = res.data[key] ?? []
        }),
      )
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'No se pudieron cargar las listas', text: errorMessage(error) })
    }
  }

  return { options, loadOptions }
}
