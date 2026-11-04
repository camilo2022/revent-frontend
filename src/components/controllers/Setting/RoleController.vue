<script setup>
import View from '@/components/templates/Setting/Role/Role.vue'
import { configuration } from '@/components/templates/Setting/Role/configuration.vue'
import Model from '@/models/Role'
import Service from '@/services/RoleService'
import { useResourceController } from '@/composables/useResourceController'

const ctrl = useResourceController({ service: Service, Model, configuration })
</script>

<template>
  <View :ctrl="ctrl" />
</template>
