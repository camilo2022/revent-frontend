<script setup>
import { useAlertStore } from '@/stores/alertStore'
import Alert from './templates/Alert.vue'

// Esquina superior derecha con las alertas del alertStore
const store = useAlertStore()
</script>

<template>
  <div class="alert-container" aria-live="polite">
    <TransitionGroup name="alert-slide">
      <Alert v-for="a in store.alerts" :key="a.id" :type="a.type" :message="a.message" @close="store.removeAlert(a.id)" />
    </TransitionGroup>
  </div>
</template>
