import { computed } from 'vue'
import { useRoute } from 'vue-router'
import resources, { locations } from './resources.config'

// Configuración del recurso y datos que salen de la ruta (ruta base y parámetros fijos)
export function useResource(key) {
  const route = useRoute()
  const config = resources[key] ?? locations[key]
  const base = computed(() => (typeof config.route === 'function' ? config.route(route.params) : config.route))
  const fixed = computed(() => config.fixed?.(route.params) ?? {})
  const perm = (action) => (config.permission ? `${config.permission}.${action}` : '')
  return { config, base, fixed, perm }
}
