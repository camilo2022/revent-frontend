<script setup>
import View from '@/components/templates/Requisition/RequestType/RequestType.vue'
import { configuration } from '@/components/templates/Requisition/RequestType/configuration.vue'
import Model from '@/models/RequestType'
import Service from '@/services/RequestTypeService'
import { useResourceController } from '@/composables/useResourceController'

const ctrl = useResourceController({ service: Service, Model, configuration })
</script>

<template>
  <View :ctrl="ctrl" />
</template>
