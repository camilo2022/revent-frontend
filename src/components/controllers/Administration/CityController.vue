<script setup>
import View from '@/components/templates/Administration/City/City.vue'
import { configuration } from '@/components/templates/Administration/City/configuration.vue'
import Model from '@/models/City'
import Service from '@/services/CityService'
import { useResourceController } from '@/composables/useResourceController'

const ctrl = useResourceController({ service: Service, Model, configuration })
</script>

<template>
  <View :ctrl="ctrl" />
</template>
