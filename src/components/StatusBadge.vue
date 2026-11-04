<script setup>
import { computed } from 'vue'

const props = defineProps({ status: String })

// Color por estado de fichas y órdenes
const colors = { Pendiente: 'warning', 'En revision': 'info', Aprobado: 'success', Cancelado: 'danger' }
const color = computed(() => colors[props.status] ?? 'secondary')
</script>

<template>
  <CBadge :color="color">{{ status === 'En revision' ? 'En revisión' : status }}</CBadge>
</template>
