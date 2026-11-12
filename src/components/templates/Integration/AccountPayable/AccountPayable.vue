<script setup>
import { computed, onMounted, ref } from 'vue'
import AccountPayableService from '@/services/integration/AccountPayableService'
import { useAlertStore } from '@/stores/alertStore'
import { useAuthStore } from '@/stores/authStore'
import { errorMessage } from '@/utils/format'
import ProviderDetail from './ProviderDetail.vue'
import ProvidersTab from './ProvidersTab.vue'
import WeeklyPaymentsTab from './WeeklyPaymentsTab.vue'

// Cuentas por pagar (Siigo): proveedores con saldo, detalle por proveedor (documentos, pagos, recibo de pago,
// anticipo y cruce contable) y pagos de todos los proveedores por semana. Cada acción tiene su propio permiso.
const auth = useAuthStore()
const alerts = useAlertStore()

const settings = ref({ type_receipt: null, bank_accounts: [], type_documents: [] })
const providers = ref([])
const loading = ref(false)
const syncing = ref(false)
const error = ref('')
const tab = ref('providers')
const current = ref(null)

const canProviders = computed(() => auth.can('integration.accounts_payable.providers'))
const canWeekly = computed(() => auth.can('integration.accounts_payable.payments_weekly'))

const loadSettings = async () => {
  if (!auth.can('integration.accounts_payable.settings')) return
  try {
    settings.value = (await AccountPayableService.settings()).data.settings
  } catch (e) {
    alerts.error(errorMessage(e))
  }
}

// silent: refresca en segundo plano sin mostrar la carga (después de un pago)
const loadProviders = async ({ silent = false, sync = false } = {}) => {
  if (!canProviders.value) return
  if (!silent) loading.value = true
  if (sync) syncing.value = true
  error.value = ''
  try {
    const res = sync ? await AccountPayableService.providersSync() : await AccountPayableService.providers()
    providers.value = res.data?.providers ?? []
    if (current.value) current.value = providers.value.find((p) => String(p.AccountID) === String(current.value.AccountID)) ?? current.value
  } catch (e) {
    if (!silent) error.value = errorMessage(e)
  } finally {
    loading.value = false
    syncing.value = false
  }
}

onMounted(() => {
  loadSettings()
  loadProviders()
})
</script>

<template>
  <CCard class="fade-in">
    <CCardHeader><strong>Cuentas por pagar</strong></CCardHeader>
    <CCardBody>
      <ProviderDetail v-if="current" :key="current.AccountID" :provider="current" :settings="settings" @back="current = null" @changed="loadProviders({ silent: true })" />

      <template v-else>
        <p class="text-body-secondary">Selecciona un proveedor para gestionar sus documentos y pagos, o consulta los pagos realizados por semana.</p>
        <p v-if="!canProviders && !canWeekly" class="text-body-secondary mb-0">No tienes permisos para consultar cuentas por pagar.</p>
        <template v-else>
          <CNav variant="tabs" class="mb-3">
            <CNavItem v-if="canProviders"><CNavLink href="#" :active="tab === 'providers'" @click="tab = 'providers'">Proveedores</CNavLink></CNavItem>
            <CNavItem v-if="canWeekly"><CNavLink href="#" :active="tab === 'weekly' || !canProviders" @click="tab = 'weekly'">Pagos</CNavLink></CNavItem>
          </CNav>
          <ProvidersTab
            v-if="canProviders && tab === 'providers'"
            :providers="providers"
            :loading="loading"
            :error="error"
            :syncing="syncing"
            @select="current = $event"
            @sync="loadProviders({ sync: true })"
            @retry="loadProviders()"
          />
          <WeeklyPaymentsTab v-else-if="canWeekly" />
        </template>
      </template>
    </CCardBody>
  </CCard>
</template>
