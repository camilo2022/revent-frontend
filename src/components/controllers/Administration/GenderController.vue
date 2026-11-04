<script setup>
import View from '@/components/templates/Administration/Gender/Gender.vue'
import { configuration } from '@/components/templates/Administration/Gender/configuration.vue'
import Model from '@/models/Gender'
import Service from '@/services/GenderService'
import { useResourceController } from '@/composables/useResourceController'

const ctrl = useResourceController({ service: Service, Model, configuration })
</script>

<template>
  <View :ctrl="ctrl" />
</template>
