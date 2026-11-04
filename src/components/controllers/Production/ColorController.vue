<script setup>
import View from '@/components/templates/Production/Color/Color.vue'
import { configuration } from '@/components/templates/Production/Color/configuration.vue'
import Model from '@/models/Color'
import Service from '@/services/ColorService'
import { useResourceController } from '@/composables/useResourceController'

const ctrl = useResourceController({ service: Service, Model, configuration })
</script>

<template>
  <View :ctrl="ctrl" />
</template>
