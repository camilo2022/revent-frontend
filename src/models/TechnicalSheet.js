import BaseModel from './BaseModel'

export default class TechnicalSheet extends BaseModel {
  static defaults() {
    return { product_id: '', trademark_id: '', category_id: '', subcategory_id: '', process: '', description: '', observation: '' }
  }
}
