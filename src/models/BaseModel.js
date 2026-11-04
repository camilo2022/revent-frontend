// Modelo base: cada recurso define sus campos y valores por defecto en `defaults()`.
export default class BaseModel {
  static defaults() {
    return {}
  }

  // Campos que salen de relaciones del registro (ej. area_id desde area.id)
  static relations() {
    return {}
  }

  constructor(data = {}) {
    Object.assign(this, structuredClone(this.constructor.defaults()), data)
  }

  // Crea el modelo desde un registro de la API, tomando solo los campos conocidos
  static from(entity) {
    const base = this.defaults()
    const picked = {}
    Object.entries(base).forEach(([key, def]) => {
      if (def === null) picked[key] = null // archivos: nunca se rellenan
      else if (typeof def === 'object' && !Array.isArray(def)) picked[key] = { ...def, ...(entity?.[key] ?? {}) }
      else picked[key] = entity?.[key] ?? def
    })
    return new this({ ...picked, ...this.relations(entity ?? {}) })
  }
}
