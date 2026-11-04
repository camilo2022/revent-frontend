import BaseModel from './BaseModel'

export default class Permission extends BaseModel {
  static defaults() {
    return { role_id: '', name: '', title: '', description: '' }
  }

  static relations(e) {
    return { role_id: e.role?.id ?? '' }
  }
}
