<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <CBreadcrumb class="my-0" aria-label="Ruta">
    <CBreadcrumbItem><RouterLink to="/">Inicio</RouterLink></CBreadcrumbItem>
    <CBreadcrumbItem v-if="route.path !== '/'" active>{{ route.meta.title }}</CBreadcrumbItem>
  </CBreadcrumb>
</template>
