import BaseModel from './BaseModel'

export default class Position extends BaseModel {
  static defaults() {
    return { area_id: '', name: '', description: '' }
  }

  static relations(e) {
    return { area_id: e.area?.id ?? '' }
  }
}
