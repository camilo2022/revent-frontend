import { useAuthStore } from '@/stores/authStore'

// v-can="'products.store'": quita el elemento si falta el permiso
export const vCan = {
  mounted(el, binding) {
    if (!useAuthStore().can(binding.value)) el.remove()
  },
}
