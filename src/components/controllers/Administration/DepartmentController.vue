<script setup>
import View from '@/components/templates/Administration/Department/Department.vue'
import { configuration } from '@/components/templates/Administration/Department/configuration.vue'
import Model from '@/models/Department'
import Service from '@/services/DepartmentService'
import { useResourceController } from '@/composables/useResourceController'

const ctrl = useResourceController({ service: Service, Model, configuration })
</script>

<template>
  <View :ctrl="ctrl" />
</template>
