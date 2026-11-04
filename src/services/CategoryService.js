import { assignService, createService } from './BaseService'

const base = '/classification/categories'

export default { ...createService(base), ...assignService('/classification/categories/subcategories') }
