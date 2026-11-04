<script setup>
import { useAuthStore } from '@/stores/authStore'

// Inicio: por ahora solo la bienvenida
const auth = useAuthStore()
</script>

<template>
  <CCard class="mb-4 shadow-sm border-0">
    <CCardBody>
      <h4 class="mb-0">Bienvenido{{ auth.userName ? `, ${auth.userName}` : '' }}</h4>
    </CCardBody>
  </CCard>
</template>
