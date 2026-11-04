import BaseModel from './BaseModel'

export default class Trademark extends BaseModel {
  static defaults() {
    return { name: '', description: '', settings: { code: '' }, icon: null, file_type_id: '' }
  }
}
