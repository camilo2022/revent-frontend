<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'

// Botón con estado de carga y control por permiso (si falta el permiso no se dibuja)
const props = defineProps({ loading: Boolean, permission: String, icon: Object, color: { type: String, default: 'primary' } })
const auth = useAuthStore()
const visible = computed(() => auth.can(props.permission))
</script>

<template>
  <CButton v-if="visible" :color="color" v-bind="$attrs" :disabled="loading || $attrs.disabled">
    <CSpinner v-if="loading" size="sm" class="me-1" />
    <CIcon v-else-if="icon" :icon="icon" class="me-1" />
    <slot />
  </CButton>
</template>
