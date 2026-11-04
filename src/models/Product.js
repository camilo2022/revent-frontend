import BaseModel from './BaseModel'

export default class Product extends BaseModel {
  static defaults() {
    return { collection_id: '', name: '', description: '', price: '', cost: '' }
  }
}
