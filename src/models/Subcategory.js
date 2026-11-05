import BaseModel from './BaseModel'

export default class Subcategory extends BaseModel {
  static defaults() {
    return { category_id: '', name: '', description: '', settings: { code: '' } }
  }

  static relations(e) {
    return { category_id: e.category?.id ?? '' }
  }
}
