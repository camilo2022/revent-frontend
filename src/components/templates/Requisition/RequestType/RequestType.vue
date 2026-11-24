<script setup>
import ResourceScreen from '@/components/UI/templates/ResourceScreen.vue'
import Form from './Form.vue'
import { configuration } from './configuration.vue'

defineProps({ ctrl: { type: Object, required: true } })
</script>

<template>
  <ResourceScreen :ctrl="ctrl" :config="configuration">
    <template #form="{ ctrl: c }">
      <Form :id="c.current?.id" @saved="c.saved(true)" @cancel="c.goIndex()" />
    </template>
  </ResourceScreen>
</template>
