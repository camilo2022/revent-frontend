<script setup>
import View from '@/components/templates/Production/Collection/Collection.vue'
import { configuration } from '@/components/templates/Production/Collection/configuration.vue'
import Model from '@/models/Collection'
import Service from '@/services/CollectionService'
import { useResourceController } from '@/composables/useResourceController'

const ctrl = useResourceController({ service: Service, Model, configuration })
</script>

<template>
  <View :ctrl="ctrl" />
</template>
