<script setup>
import View from '@/components/templates/Administration/CompensationFund/CompensationFund.vue'
import { configuration } from '@/components/templates/Administration/CompensationFund/configuration.vue'
import Model from '@/models/CompensationFund'
import Service from '@/services/CompensationFundService'
import { useResourceController } from '@/composables/useResourceController'

const ctrl = useResourceController({ service: Service, Model, configuration })
</script>

<template>
  <View :ctrl="ctrl" />
</template>
