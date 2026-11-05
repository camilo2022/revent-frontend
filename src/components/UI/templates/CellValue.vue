<script setup>
import { fileUrl } from '@/utils/format'
import { getPath } from '@/utils/paths'
import Avatar from './Avatar.vue'
import StatusBadge from './StatusBadge.vue'

// Valor de una celda según la columna de la configuración (value(row) o ruta con puntos)
const props = defineProps({ row: { type: Object, required: true }, col: { type: Object, required: true } })
const fallbackIcon = '/favicon.svg'
const text = () => (props.col.value ? props.col.value(props.row) : getPath(props.row, props.col.key)) ?? '-'
</script>

<template>
  <Avatar v-if="col.type === 'photo'" :src="fileUrl(row.photo)" :names="row.names" :last-names="row.last_names" :size="36" />
  <!-- Sin ícono cargado (o si no carga) se muestra el RV de Revent -->
  <img
    v-else-if="col.type === 'icon'"
    :src="fileUrl(row.icon) || fallbackIcon"
    alt=""
    class="rounded border"
    style="width: 36px; height: 36px; object-fit: cover"
    @error="$event.target.src !== fallbackIcon && ($event.target.src = fallbackIcon)"
  />
  <StatusBadge v-else-if="col.type === 'status'" :status="text()" />
  <template v-else>{{ text() }}</template>
</template>
