import BaseModel from './BaseModel'

export default class Area extends BaseModel {
  static defaults() {
    return { name: '', description: '' }
  }
}
