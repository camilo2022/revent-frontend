<script setup>
import ResourceScreen from '@/components/UI/templates/ResourceScreen.vue'
import SubmoduleController from '@/components/controllers/Setting/SubmoduleController.vue'
import { configuration } from './configuration.vue'

defineProps({ ctrl: { type: Object, required: true } })
</script>

<template>
  <ResourceScreen :ctrl="ctrl" :config="configuration">
    <template #panel="{ row, back }"><SubmoduleController :module="row" @back="back" /></template>
  </ResourceScreen>
</template>
