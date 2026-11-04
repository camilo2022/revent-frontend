<script setup>
// Página sencilla para 403, 404 y 500
const props = defineProps({ code: { type: Number, required: true } })

const texts = {
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
      <RouterLink to="/"><CButton color="primary">Volver al inicio</CButton></RouterLink>
    </div>
  </div>
</template>
