<script setup>
import View from '@/components/templates/Administration/RiskManager/RiskManager.vue'
import { configuration } from '@/components/templates/Administration/RiskManager/configuration.vue'
import Model from '@/models/RiskManager'
import Service from '@/services/RiskManagerService'
import { useResourceController } from '@/composables/useResourceController'

const ctrl = useResourceController({ service: Service, Model, configuration })
</script>

<template>
  <View :ctrl="ctrl" />
</template>
