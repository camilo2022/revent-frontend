<script setup>
import View from '@/components/templates/Administration/Area/Area.vue'
import { configuration } from '@/components/templates/Administration/Area/configuration.vue'
import Model from '@/models/Area'
import Service from '@/services/AreaService'
import { useResourceController } from '@/composables/useResourceController'

const ctrl = useResourceController({ service: Service, Model, configuration })
</script>

<template>
  <View :ctrl="ctrl" />
</template>
