import { useAuthStore } from '@/stores/auth'

// v-can="'products.store'": quita el elemento si falta el permiso
export const vCan = {
  mounted(el, binding) {
    if (!useAuthStore().can(binding.value)) el.remove()
  },
}
