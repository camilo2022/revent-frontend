<script setup>
import View from '@/components/templates/Administration/PensionFund/PensionFund.vue'
import { configuration } from '@/components/templates/Administration/PensionFund/configuration.vue'
import Model from '@/models/PensionFund'
import Service from '@/services/PensionFundService'
import { useResourceController } from '@/composables/useResourceController'

const ctrl = useResourceController({ service: Service, Model, configuration })
</script>

<template>
  <View :ctrl="ctrl" />
</template>
