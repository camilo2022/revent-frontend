<script setup>
import View from '@/components/templates/Administration/BloodType/BloodType.vue'
import { configuration } from '@/components/templates/Administration/BloodType/configuration.vue'
import Model from '@/models/BloodType'
import Service from '@/services/BloodTypeService'
import { useResourceController } from '@/composables/useResourceController'

const ctrl = useResourceController({ service: Service, Model, configuration })
</script>

<template>
  <View :ctrl="ctrl" />
</template>
