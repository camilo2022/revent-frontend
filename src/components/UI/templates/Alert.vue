<script setup>
import { cilCheckCircle, cilInfo, cilWarning, cilXCircle } from '@coreui/icons'

// Una alerta flotante (la maneja AlertContainer). Sin la transición de CoreUI: la alerta nace visible y CAlert nunca
// le pone la clase `show`, así que con `fade` quedaba en opacidad 0 (invisible); la animación la da el TransitionGroup del contenedor.
const props = defineProps({ type: { type: String, default: 'info' }, message: String })
defineEmits(['close'])
const icons = { success: cilCheckCircle, danger: cilXCircle, warning: cilWarning, info: cilInfo }
</script>

<template>
  <CAlert :color="props.type" dismissible :transition="false" class="shadow-sm d-flex align-items-start gap-2 mb-2" :role="props.type === 'danger' ? 'alert' : 'status'" @close="$emit('close')">
    <CIcon :icon="icons[props.type]" class="flex-shrink-0 mt-1" />
    <span>{{ props.message }}</span>
  </CAlert>
</template>
