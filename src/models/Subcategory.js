import BaseModel from './BaseModel'

export default class Subcategory extends BaseModel {
  static defaults() {
    return { name: '', description: '', settings: { code: '' } }
  }
}
