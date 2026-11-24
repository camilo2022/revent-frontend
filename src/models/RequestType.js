import BaseModel from './BaseModel'

export default class RequestType extends BaseModel {
  static defaults() {
    return { name: '', description: '', settings: { fields: [] } }
  }
}
