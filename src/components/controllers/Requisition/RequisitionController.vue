<script setup>
import View from '@/components/templates/Requisition/Requisition/Requisition.vue'
import { configuration } from '@/components/templates/Requisition/Requisition/configuration.vue'
import Model from '@/models/Requisition'
import Service from '@/services/RequisitionService'
import { useResourceController } from '@/composables/useResourceController'

const ctrl = useResourceController({ service: Service, Model, configuration })
</script>

<template>
  <View :ctrl="ctrl" />
</template>
