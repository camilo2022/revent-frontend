import BaseModel from './BaseModel'

export default class FileType extends BaseModel {
  static defaults() {
    return { name: '', description: '' }
  }
}
