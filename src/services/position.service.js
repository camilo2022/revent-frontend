import { makeAssign, makeCrud } from './crud'

const base = '/organizational_structure/positions'

export const positionService = {
  ...makeCrud(base),
  ...makeAssign(`${base}/authorization`),
}
