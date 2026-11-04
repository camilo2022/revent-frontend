<script setup>
import View from '@/components/templates/Setting/Module/Module.vue'
import { configuration } from '@/components/templates/Setting/Module/configuration.vue'
import Model from '@/models/Module'
import Service from '@/services/ModuleService'
import { useResourceController } from '@/composables/useResourceController'

const ctrl = useResourceController({ service: Service, Model, configuration })
</script>

<template>
  <View :ctrl="ctrl" />
</template>
