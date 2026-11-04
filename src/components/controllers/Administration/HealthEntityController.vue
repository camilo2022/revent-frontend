<script setup>
import View from '@/components/templates/Administration/HealthEntity/HealthEntity.vue'
import { configuration } from '@/components/templates/Administration/HealthEntity/configuration.vue'
import Model from '@/models/HealthEntity'
import Service from '@/services/HealthEntityService'
import { useResourceController } from '@/composables/useResourceController'

const ctrl = useResourceController({ service: Service, Model, configuration })
</script>

<template>
  <View :ctrl="ctrl" />
</template>
