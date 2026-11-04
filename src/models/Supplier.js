import BaseModel from './BaseModel'

export default class Supplier extends BaseModel {
  static defaults() {
    return { code: '', legal_name: '', trade_name: '', document_type_id: '', document: '', location_type: '', location_id: '', address: '', neighborhood: '', phone_country_id: '', phone: '', email: '', file: null, file_type_id: '' }
  }

  static relations(e) {
    return { document_type_id: e.document_type_id ?? '', file: null }
  }
}
