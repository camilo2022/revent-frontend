import BaseModel from './BaseModel'

export default class DocumentType extends BaseModel {
  static defaults() {
    return { person_type_id: '', name: '', description: '', settings: { code: '' } }
  }

  static relations(e) {
    return { person_type_id: e.person_type?.id ?? '' }
  }
}
