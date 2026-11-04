import BaseModel from './BaseModel'

export default class Role extends BaseModel {
  static defaults() {
    return { name: '', title: '', description: '' }
  }
}
