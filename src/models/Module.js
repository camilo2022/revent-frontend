import BaseModel from './BaseModel'

export default class Module extends BaseModel {
  static defaults() {
    return { name: '', icon: '' }
  }
}
