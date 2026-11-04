<script setup>
import View from '@/components/templates/Administration/Position/Position.vue'
import { configuration } from '@/components/templates/Administration/Position/configuration.vue'
import Model from '@/models/Position'
import Service from '@/services/PositionService'
import { useResourceController } from '@/composables/useResourceController'

const ctrl = useResourceController({ service: Service, Model, configuration })
</script>

<template>
  <View :ctrl="ctrl" />
</template>
