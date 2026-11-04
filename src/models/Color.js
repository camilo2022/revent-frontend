import BaseModel from './BaseModel'

export default class Color extends BaseModel {
  static defaults() {
    return { name: '', description: '', settings: { code: '' } }
  }
}
