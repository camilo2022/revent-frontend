import BaseModel from './BaseModel'

export default class Employee extends BaseModel {
  static defaults() {
    return { person_id: '', position_id: '', risk_manager_id: '', health_entity_id: '', pension_fund_id: '', compensation_fund_id: '', start_date: '', end_date: '' }
  }

  static relations(e) {
    return { start_date: String(e.start_date ?? '').slice(0, 10), end_date: String(e.end_date ?? '').slice(0, 10) }
  }
}
