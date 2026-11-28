<script setup>
import { computed } from 'vue'

const props = defineProps({ status: String })

// Color por estado de fichas, órdenes y solicitudes: cada estado con el suyo (etiqueta suave con punto, como Kanri)
const colors = {
  Pendiente: 'warning', 'En revision': 'info', 'En revisión': 'info', Aprobado: 'success',
  'En progreso': 'primary', Completado: 'dark', Rechazado: 'danger', Cancelado: 'danger',
}
const color = computed(() => colors[props.status] ?? 'secondary')
</script>

<template>
  <span :class="['badge rounded-pill d-inline-flex align-items-center gap-1 border fw-semibold', `bg-${color}-subtle text-${color}-emphasis border-${color}-subtle`]">
    <span :class="['rounded-circle d-inline-block', `bg-${color}`]" style="width: 7px; height: 7px"></span>
    {{ status === 'En revision' ? 'En revisión' : status }}
  </span>
</template>
