import { computed, toValue } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useIntegrationStore } from '@/stores/integrationStore'
import { KINDS } from '@/config/integration'

// Qué credenciales de Siigo necesita una pantalla y si ya están listas.
// Sin argumento lee `meta.siigo` de la ruta (['token'], ['cookie'] o ambas).
export function useSiigoCredentials(kinds) {
  const store = useIntegrationStore()
  const route = useRoute()
  const router = useRouter()

  const required = computed(() => toValue(kinds) ?? route.meta.siigo ?? [])
  const state = computed(() => store.needs(required.value))
  const labels = (list) => list.map((k) => KINDS[k].label)

  return {
    required,
    ready: computed(() => state.value.ready),
    missing: computed(() => state.value.missing),
    expired: computed(() => state.value.expired),
    missingLabels: computed(() => labels(required.value.filter((k) => !store.usable(k)))),
    goToSettings: () => router.push('/siigo_authorization'),
  }
}
