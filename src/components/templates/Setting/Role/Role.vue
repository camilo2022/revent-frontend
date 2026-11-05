<script setup>
import ResourceScreen from '@/components/UI/templates/ResourceScreen.vue'
import ChildPanel from '@/components/UI/templates/ChildPanel.vue'
import Permission from '@/models/Permission'
import PermissionService from '@/services/PermissionService'
import { configuration } from './configuration.vue'
import { roleConfiguration } from '@/components/templates/Setting/Permission/configuration.vue'

defineProps({ ctrl: { type: Object, required: true } })
</script>

<template>
  <ResourceScreen :ctrl="ctrl" :config="configuration">
    <template #panel="{ row, back }">
      <ChildPanel :parent="row" parent-key="role_id" parent-title="Roles" parent-label="Rol" :service="PermissionService" :model="Permission" :config="roleConfiguration" @back="back" />
    </template>
  </ResourceScreen>
</template>
