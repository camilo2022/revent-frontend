<script setup>
import { computed } from 'vue'
import { cilWarning } from '@coreui/icons'

// Los errores de validación se ven en cada campo (borde rojo + ícono). Aquí solo se listan los de filas
// anidadas (por ejemplo, una cantidad de la matriz), que no tienen un campo propio donde dibujarse.
const props = defineProps({ message: String, errors: { type: Object, default: () => ({}) }, attributes: { type: Object, default: () => ({}) } })

const label = (key) => props.attributes[key] ?? props.attributes[key.replace(/[.][0-9]+[.]/g, '.*.')] ?? ''
const list = computed(() =>
  Object.entries(props.errors)
    .filter(([key]) => /[.][0-9]+[.]/.test(key))
    .flatMap(([key, msgs]) => msgs.map((m) => (label(key) ? `${label(key)}: ${m}` : m))),
)
</script>

<template>
  <ul v-if="list.length" class="list-unstyled small text-danger mb-3">
    <li v-for="e in list" :key="e" class="d-flex align-items-center gap-1"><CIcon :icon="cilWarning" size="sm" /> {{ e }}</li>
  </ul>
</template>
