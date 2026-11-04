import { assignService, createService } from './BaseService'

const base = '/organizational_structure/positions'

export default { ...createService(base), ...assignService('/organizational_structure/positions/authorization') }
