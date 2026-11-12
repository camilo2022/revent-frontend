<script setup>
import ResourceScreen from '@/components/UI/templates/ResourceScreen.vue'
import AssignPanel from '@/components/UI/templates/AssignPanel.vue'
import StoreAssignPanel from '@/components/UI/templates/StoreAssignPanel.vue'
import { configuration } from './configuration.vue'

defineProps({ ctrl: { type: Object, required: true } })
</script>

<template>
  <ResourceScreen :ctrl="ctrl" :config="configuration">
    <template #panel="{ row, back, mode }">
      <StoreAssignPanel v-if="mode === 'stores'" :record="row" @back="back" />
      <AssignPanel v-else kind="users" :record="row" @back="back" />
    </template>
  </ResourceScreen>
</template>
