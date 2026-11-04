import BaseModel from './BaseModel'

export default class PensionFund extends BaseModel {
  static defaults() {
    return { name: '', description: '' }
  }
}
