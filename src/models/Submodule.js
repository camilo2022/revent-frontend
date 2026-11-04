import BaseModel from './BaseModel'

export default class Submodule extends BaseModel {
  static defaults() {
    return { module_id: '', permission_id: '', name: '', url: '', icon: '' }
  }

  static relations(e) {
    return { permission_id: e.permission?.id ?? '', module_id: e.module?.id ?? '' }
  }
}
