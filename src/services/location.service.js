import { makeReadOnly } from './crud'

// Ubicaciones: solo lectura
export const continentService = makeReadOnly('/location/continents')
export const regionService = makeReadOnly('/location/regions')
export const countryService = makeReadOnly('/location/countries')
export const departmentService = makeReadOnly('/location/departments')
export const cityService = makeReadOnly('/location/cities')
