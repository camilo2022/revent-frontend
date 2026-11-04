import BaseModel from './BaseModel'

export default class Audit extends BaseModel {
  static defaults() {
    return { user_id: '', event: '', start_date: '', end_date: '' }
  }
}
