import BaseModel from './BaseModel'

export default class RiskManager extends BaseModel {
  static defaults() {
    return { name: '', description: '' }
  }
}
