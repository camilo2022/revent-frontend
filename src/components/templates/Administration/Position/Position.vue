<script setup>
import ResourceScreen from '@/components/UI/templates/ResourceScreen.vue'
import AssignPanel from '@/components/UI/templates/AssignPanel.vue'
import { configuration } from './configuration.vue'

defineProps({ ctrl: { type: Object, required: true } })
</script>

<template>
  <ResourceScreen :ctrl="ctrl" :config="configuration">
    <template #panel="{ row, back }"><AssignPanel kind="positions" :record="row" @back="back" /></template>
  </ResourceScreen>
</template>
