import BaseModel from './BaseModel'

export default class Requisition extends BaseModel {
  static defaults() {
    return { request_type_id: '', observation: '', data: {} }
  }
}
