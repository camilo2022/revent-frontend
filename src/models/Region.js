import BaseModel from './BaseModel'

export default class Region extends BaseModel {
  static defaults() {
    return { name: '' }
  }
}
