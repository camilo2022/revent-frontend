<script setup>
import { cilClock } from '@coreui/icons'

// Confirmación de las acciones que se hacen en segundo plano (exportes, traslados, sync): el resultado llega por correo
defineProps({ message: { type: String, default: '' }, emails: { type: Array, default: () => [] } })
</script>

<template>
  <CAlert color="info" class="d-flex align-items-start gap-2 mb-0">
    <CIcon :icon="cilClock" size="lg" class="mt-1 flex-shrink-0" />
    <div>
      <strong>{{ message || 'La tarea quedó en cola.' }}</strong>
      <div v-if="emails.length" class="small">Te enviaremos el resultado a: {{ emails.join(', ') }}</div>
      <slot />
    </div>
  </CAlert>
</template>
