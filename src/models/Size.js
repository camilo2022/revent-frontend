import BaseModel from './BaseModel'

export default class Size extends BaseModel {
  static defaults() {
    return { name: '', description: '', settings: { code: '' }, icon: { file: null } }
  }

  static relations(e) {
    return { icon: { file: null } }
  }
}
