import BaseModel from './BaseModel'

export default class PersonType extends BaseModel {
  static defaults() {
    return { name: '', description: '', settings: { code: '' } }
  }
}
