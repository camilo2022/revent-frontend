<script setup>
import View from '@/components/templates/Production/Store/Store.vue'
import { configuration } from '@/components/templates/Production/Store/configuration.vue'
import Model from '@/models/Store'
import Service from '@/services/StoreService'
import { useResourceController } from '@/composables/useResourceController'

const ctrl = useResourceController({ service: Service, Model, configuration })
</script>

<template>
  <View :ctrl="ctrl" />
</template>
