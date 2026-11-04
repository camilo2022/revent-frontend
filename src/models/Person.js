import BaseModel from './BaseModel'

export default class Person extends BaseModel {
  static defaults() {
    return { names: '', last_names: '', document_type_id: '', document: '', gender_id: '', birth_date: '', blood_type_id: '', location_type: '', location_id: '', address: '', neighborhood: '', phone_country_id: '', phone: '', email: '', photo: null, photo_type_id: '' }
  }

  static relations(e) {
    return { birth_date: String(e.birth_date ?? '').slice(0, 10) }
  }
}
