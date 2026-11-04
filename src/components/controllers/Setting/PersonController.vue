<script setup>
import View from '@/components/templates/Setting/Person/Person.vue'
import { configuration } from '@/components/templates/Setting/Person/configuration.vue'
import Model from '@/models/Person'
import Service from '@/services/PersonService'
import { useResourceController } from '@/composables/useResourceController'

const ctrl = useResourceController({ service: Service, Model, configuration })
</script>

<template>
  <View :ctrl="ctrl" />
</template>
