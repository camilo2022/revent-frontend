<script setup>
import View from '@/components/templates/Administration/PersonType/PersonType.vue'
import { configuration } from '@/components/templates/Administration/PersonType/configuration.vue'
import Model from '@/models/PersonType'
import Service from '@/services/PersonTypeService'
import { useResourceController } from '@/composables/useResourceController'

const ctrl = useResourceController({ service: Service, Model, configuration })
</script>

<template>
  <View :ctrl="ctrl" />
</template>
