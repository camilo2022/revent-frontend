<script setup>
import View from '@/components/templates/Production/TechnicalSheet/TechnicalSheet.vue'
import { configuration } from '@/components/templates/Production/TechnicalSheet/configuration.vue'
import Model from '@/models/TechnicalSheet'
import Service from '@/services/TechnicalSheetService'
import { useResourceController } from '@/composables/useResourceController'

const ctrl = useResourceController({ service: Service, Model, configuration })
</script>

<template>
  <View :ctrl="ctrl" />
</template>
