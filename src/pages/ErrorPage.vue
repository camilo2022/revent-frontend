<script setup>
import { cilHome, cilLockLocked } from '@coreui/icons'
// Página sencilla para 403, 404 y 500
const props = defineProps({ code: { type: Number, required: true } })

const texts = {
  401: ['Sin sesión', 'Debes iniciar sesión para ver esta página.'],
  403: ['Acceso denegado', 'No tienes permiso para ver esta página.'],
  404: ['Página no encontrada', 'La página que buscas no existe.'],
  500: ['Error del servidor', 'Algo salió mal. Intenta de nuevo más tarde.'],
}
</script>

<template>
  <div class="min-vh-100 d-flex align-items-center justify-content-center bg-body-tertiary text-center">
    <div>
      <h1 class="display-1 fw-bold text-primary">{{ props.code }}</h1>
      <h4>{{ texts[props.code][0] }}</h4>
      <p class="text-body-secondary">{{ texts[props.code][1] }}</p>
      <RouterLink v-if="props.code === 401" to="/login"><CButton color="primary"><CIcon :icon="cilLockLocked" /> Iniciar sesión</CButton></RouterLink>
      <RouterLink v-else to="/"><CButton color="primary"><CIcon :icon="cilHome" /> Volver al inicio</CButton></RouterLink>
    </div>
  </div>
</template>
