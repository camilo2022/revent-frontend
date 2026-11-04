<script setup>
import View from '@/components/templates/Administration/Continent/Continent.vue'
import { configuration } from '@/components/templates/Administration/Continent/configuration.vue'
import Model from '@/models/Continent'
import Service from '@/services/ContinentService'
import { useResourceController } from '@/composables/useResourceController'

const ctrl = useResourceController({ service: Service, Model, configuration })
</script>

<template>
  <View :ctrl="ctrl" />
</template>
