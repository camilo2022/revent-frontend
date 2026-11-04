import BaseModel from './BaseModel'

export default class Continent extends BaseModel {
  static defaults() {
    return { name: '' }
  }
}
