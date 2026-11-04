import BaseModel from './BaseModel'

export default class CompensationFund extends BaseModel {
  static defaults() {
    return { name: '', description: '' }
  }
}
