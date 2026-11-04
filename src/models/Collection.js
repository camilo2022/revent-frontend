import BaseModel from './BaseModel'

// Las colecciones son subítems como Colores y Marcas: año y código viajan en `settings`
export default class Collection extends BaseModel {
  static defaults() {
    return { name: '', description: '', settings: { year: '', code: '' } }
  }
}
