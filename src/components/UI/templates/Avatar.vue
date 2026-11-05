<script setup>
import { computed, ref, watch } from 'vue'

// Foto en círculo; si no hay foto (o no carga) muestra las iniciales del primer nombre y el primer apellido
const props = defineProps({
  src: { type: String, default: '' },
  names: { type: String, default: '' },
  lastNames: { type: String, default: '' },
  size: { type: Number, default: 36 },
})

const failed = ref(false)
watch(() => props.src, () => (failed.value = false))

const initials = computed(() => {
  const first = (s) => (s || '').trim().split(/\s+/)[0]?.charAt(0) ?? ''
  return (first(props.names) + first(props.lastNames)).toUpperCase() || '?'
})
</script>

<template>
  <img
    v-if="src && !failed"
    :src="src"
    alt=""
    class="rounded-circle border"
    :style="{ width: size + 'px', height: size + 'px', objectFit: 'cover' }"
    @error="failed = true"
  />
  <span
    v-else
    class="rounded-circle d-inline-flex align-items-center justify-content-center fw-semibold bg-primary-subtle text-primary"
    :style="{ width: size + 'px', height: size + 'px', fontSize: size * 0.4 + 'px' }"
    :title="`${names} ${lastNames}`.trim()"
  >{{ initials }}</span>
</template>
