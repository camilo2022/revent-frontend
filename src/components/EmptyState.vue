<script setup>
import { CIcon } from '@coreui/icons-vue'
import { cilInbox } from '@coreui/icons'
defineProps({ text: { type: String, default: 'No hay registros para mostrar.' } })
</script>

<template>
  <div class="text-center text-body-secondary py-5">
    <CIcon :icon="cilInbox" size="3xl" class="mb-2" />
    <div>{{ text }}</div>
    <slot />
  </div>
</template>
