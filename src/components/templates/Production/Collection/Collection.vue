<script setup>
import ResourceScreen from '@/components/UI/templates/ResourceScreen.vue'
import { configuration } from './configuration.vue'

defineProps({ ctrl: { type: Object, required: true } })
</script>

<template>
  <ResourceScreen :ctrl="ctrl" :config="configuration"></ResourceScreen>
</template>
