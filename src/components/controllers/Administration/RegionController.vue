<script setup>
import View from '@/components/templates/Administration/Region/Region.vue'
import { configuration } from '@/components/templates/Administration/Region/configuration.vue'
import Model from '@/models/Region'
import Service from '@/services/RegionService'
import { useResourceController } from '@/composables/useResourceController'

const ctrl = useResourceController({ service: Service, Model, configuration })
</script>

<template>
  <View :ctrl="ctrl" />
</template>
