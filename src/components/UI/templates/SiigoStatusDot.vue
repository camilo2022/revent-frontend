<script setup>
import { computed } from 'vue'
import { STATUS } from '@/config/integration'

// Punto de color con el estado de una credencial de Siigo (vigente, vence pronto, vencida, sin cargar)
const props = defineProps({ status: { type: String, default: 'empty' }, size: { type: Number, default: 10 } })
const info = computed(() => STATUS[props.status] ?? STATUS.empty)
</script>

<template>
  <span class="d-inline-block rounded-circle flex-shrink-0" :class="`bg-${info.color}`" :style="{ width: `${size}px`, height: `${size}px` }" :title="info.label" role="img" :aria-label="info.label"></span>
</template>
