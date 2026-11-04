<script setup>
import View from '@/components/templates/Production/ProductionOrder/ProductionOrder.vue'
import { configuration } from '@/components/templates/Production/ProductionOrder/configuration.vue'
import Model from '@/models/ProductionOrder'
import Service from '@/services/ProductionOrderService'
import { useResourceController } from '@/composables/useResourceController'

const ctrl = useResourceController({ service: Service, Model, configuration })
</script>

<template>
  <View :ctrl="ctrl" />
</template>
