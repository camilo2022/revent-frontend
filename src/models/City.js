import BaseModel from './BaseModel'

export default class City extends BaseModel {
  static defaults() {
    return { name: '' }
  }
}
