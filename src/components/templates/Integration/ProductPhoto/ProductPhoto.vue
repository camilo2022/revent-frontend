<script setup>
import { computed, ref, watchEffect } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import BulkTab from './BulkTab.vue'
import ExplorerTab from './ExplorerTab.vue'
import ReferenceTab from './ReferenceTab.vue'

// Fotos de producto: por referencia, carga masiva con ZIP y explorador de carpetas. Cada pestaña se muestra según los permisos.
const auth = useAuthStore()

const tabs = computed(() =>
  [
    { key: 'reference', label: 'Por referencia', visible: auth.can('integration.product_photos.search') },
    { key: 'bulk', label: 'Carga masiva ZIP', visible: auth.can('integration.product_photos.bulk_upload') },
    { key: 'explorer', label: 'Explorador', visible: auth.can('integration.product_photos.explorer') },
  ].filter((tab) => tab.visible)
)

const tab = ref('reference')
// Si la pestaña activa no está permitida, se abre la primera disponible
watchEffect(() => {
  if (tabs.value.length && !tabs.value.some((item) => item.key === tab.value)) tab.value = tabs.value[0].key
})
</script>

<template>
  <CCard class="fade-in">
    <CCardHeader><strong>Fotos de producto</strong></CCardHeader>
    <CCardBody>
      <p class="text-body-secondary">Busca una referencia para ver, subir o eliminar sus fotos, o carga muchas a la vez.</p>

      <CNav variant="tabs" class="mb-3">
        <CNavItem v-for="item in tabs" :key="item.key">
          <CNavLink href="#" :active="tab === item.key" @click="tab = item.key">{{ item.label }}</CNavLink>
        </CNavItem>
      </CNav>

      <ReferenceTab v-if="tab === 'reference'" />
      <BulkTab v-else-if="tab === 'bulk'" />
      <ExplorerTab v-else-if="tab === 'explorer'" />
    </CCardBody>
  </CCard>
</template>
