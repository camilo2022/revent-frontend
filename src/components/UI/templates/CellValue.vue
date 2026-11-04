<script setup>
import { fileUrl } from '@/utils/format'
import { getPath } from '@/utils/paths'
import StatusBadge from './StatusBadge.vue'

// Valor de una celda según la columna de la configuración (value(row) o ruta con puntos)
const props = defineProps({ row: { type: Object, required: true }, col: { type: Object, required: true } })
const text = () => (props.col.value ? props.col.value(props.row) : getPath(props.row, props.col.key)) ?? '-'
</script>

<template>
  <img
    v-if="col.type === 'photo' || col.type === 'icon'"
    :src="fileUrl(row[col.type === 'photo' ? 'photo' : 'icon'])"
    alt=""
    class="rounded border"
    style="width: 36px; height: 36px; object-fit: cover"
    @error="$event.target.style.visibility = 'hidden'"
  />
  <StatusBadge v-else-if="col.type === 'status'" :status="text()" />
  <template v-else>{{ text() }}</template>
</template>
