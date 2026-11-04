<script setup>
import { computed } from 'vue'

// Resumen de errores del servidor (mensaje general + todos los detalles)
const props = defineProps({ message: String, errors: { type: Object, default: () => ({}) } })
const list = computed(() => [...new Set(Object.values(props.errors).flat())])
</script>

<template>
  <CAlert v-if="message || list.length" color="danger" class="mb-3">
    <div v-if="message" class="fw-semibold">{{ message }}</div>
    <ul class="mb-0 ps-3">
      <li v-for="e in list" :key="e">{{ e }}</li>
    </ul>
  </CAlert>
</template>
