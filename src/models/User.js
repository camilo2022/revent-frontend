import BaseModel from './BaseModel'

export default class User extends BaseModel {
  static defaults() {
    return { employee_id: '', username: '', password: '', password_confirmation: '' }
  }
}
