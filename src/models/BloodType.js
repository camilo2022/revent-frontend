import BaseModel from './BaseModel'

export default class BloodType extends BaseModel {
  static defaults() {
    return { name: '', description: '' }
  }
}
