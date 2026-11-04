import { useAuthStore } from '@/stores/authStore'

// Permite preguntar `can('products.store')` en cualquier componente
export function usePermissions() {
  const auth = useAuthStore()
  return { can: (permission) => auth.can(permission) }
}
