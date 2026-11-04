import BaseModel from './BaseModel'

export default class ProductionOrder extends BaseModel {
  static defaults() {
    return { technical_sheet_id: '', supplier_id: '', due_date: '', vat_percentage: 100, delivery_note_percentage: 0 }
  }
}
