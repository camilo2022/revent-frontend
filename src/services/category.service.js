import { makeAssign, makeCrud } from './crud'

const base = '/classification/categories'

// assign/remove reciben { subcategory_id }
export const categoryService = {
  ...makeCrud(base),
  ...makeAssign(`${base}/subcategories`),
}
