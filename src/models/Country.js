import BaseModel from './BaseModel'

export default class Country extends BaseModel {
  static defaults() {
    return { name: '' }
  }
}
