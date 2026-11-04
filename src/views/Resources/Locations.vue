<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { locations } from './resources.config'
import ResourceList from './ResourceList.vue'

// Ubicaciones de solo lectura: una pestaña por tipo (el tipo va en la ruta)
const route = useRoute()
const router = useRouter()
const kind = computed(() => (locations[route.params.kind] ? route.params.kind : 'countries'))
</script>

<template>
  <CNav variant="tabs" class="mb-3">
    <CNavItem v-for="(c, key) in locations" :key="key">
      <CNavLink href="#" :active="kind === key" @click.prevent="router.push(`/locations/${key}`)">{{ c.title }}</CNavLink>
    </CNavItem>
  </CNav>
  <ResourceList :key="kind" :resource="kind" />
</template>
