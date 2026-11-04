<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// Inicio > [sección padre] > página actual
const crumbs = computed(() => {
  const list = [{ title: 'Inicio', to: '/' }]
  if (route.meta.parent) list.push(route.meta.parent)
  if (route.path !== '/') list.push({ title: route.meta.title, active: true })
  return list
})
</script>

<template>
  <CBreadcrumb class="my-0">
    <CBreadcrumbItem v-for="c in crumbs" :key="c.title" :active="c.active">
      <RouterLink v-if="c.to" :to="c.to">{{ c.title }}</RouterLink>
      <template v-else>{{ c.title }}</template>
    </CBreadcrumbItem>
  </CBreadcrumb>
</template>
