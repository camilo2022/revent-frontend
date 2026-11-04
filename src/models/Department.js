import BaseModel from './BaseModel'

export default class Department extends BaseModel {
  static defaults() {
    return { name: '' }
  }
}
