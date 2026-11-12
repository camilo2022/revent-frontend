<script setup>
import { cilLockLocked } from '@coreui/icons'
import { useSiigoCredentials } from '@/composables/useSiigoCredentials'

// Aviso arriba de las pantallas que necesitan el token o la cookie de Siigo. Desaparece cuando ya están cargadas y vigentes.
// Uso: <SiigoCredentialNotice /> (lee meta.siigo de la ruta) o <SiigoCredentialNotice :kinds="['token']" />
const props = defineProps({ kinds: { type: Array, default: undefined } })
const { ready, required, missingLabels, goToSettings } = useSiigoCredentials(() => props.kinds)
</script>

<template>
  <CAlert v-if="required.length && !ready" color="warning" class="d-flex flex-wrap align-items-center justify-content-between gap-2">
    <span>
      <CIcon :icon="cilLockLocked" class="me-2" />
      Esta pantalla necesita tu <strong>{{ missingLabels.join(' y tu ') }}</strong> de Siigo. Cárgalo en <em>Autorización Siigo</em>.
    </span>
    <CButton color="warning" size="sm" @click="goToSettings">Ir a Autorización Siigo</CButton>
  </CAlert>
</template>
