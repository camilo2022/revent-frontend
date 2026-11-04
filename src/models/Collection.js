import BaseModel from './BaseModel'

export default class Collection extends BaseModel {
  static defaults() {
    return { name: '', description: '', year: '', code: '' }
  }
}
