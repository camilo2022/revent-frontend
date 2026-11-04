import { assignService, createService } from './BaseService'

const base = '/users'

export default { ...createService(base), ...assignService('/users/authorization') }
