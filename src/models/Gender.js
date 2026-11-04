import BaseModel from './BaseModel'

export default class Gender extends BaseModel {
  static defaults() {
    return { name: '', description: '' }
  }
}
