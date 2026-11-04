<script setup>
import View from '@/components/templates/Administration/Country/Country.vue'
import { configuration } from '@/components/templates/Administration/Country/configuration.vue'
import Model from '@/models/Country'
import Service from '@/services/CountryService'
import { useResourceController } from '@/composables/useResourceController'

const ctrl = useResourceController({ service: Service, Model, configuration })
</script>

<template>
  <View :ctrl="ctrl" />
</template>
