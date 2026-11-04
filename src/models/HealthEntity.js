import BaseModel from './BaseModel'

export default class HealthEntity extends BaseModel {
  static defaults() {
    return { name: '', description: '' }
  }
}
