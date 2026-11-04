import BaseModel from './BaseModel'

export default class Store extends BaseModel {
  static defaults() {
    return { code: '', name: '', location_type: '', location_id: '', address: '', neighborhood: '' }
  }
}
