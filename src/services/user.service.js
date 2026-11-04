import { makeAssign, makeCrud } from './crud'

export const userService = {
  ...makeCrud('/users'),
  ...makeAssign('/users/authorization'),
}
