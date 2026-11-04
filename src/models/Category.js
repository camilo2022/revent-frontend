import BaseModel from './BaseModel'

export default class Category extends BaseModel {
  static defaults() {
    return { name: '', description: '', settings: { code: '' } }
  }
}
