<script setup>
import View from '@/components/templates/Setting/User/User.vue'
import { configuration } from '@/components/templates/Setting/User/configuration.vue'
import Model from '@/models/User'
import Service from '@/services/UserService'
import { useResourceController } from '@/composables/useResourceController'

const ctrl = useResourceController({ service: Service, Model, configuration })
</script>

<template>
  <View :ctrl="ctrl" />
</template>
