<script setup>
import View from '@/components/templates/Setting/Permission/Permission.vue'
import { configuration } from '@/components/templates/Setting/Permission/configuration.vue'
import Model from '@/models/Permission'
import Service from '@/services/PermissionService'
import { useResourceController } from '@/composables/useResourceController'

const ctrl = useResourceController({ service: Service, Model, configuration })
</script>

<template>
  <View :ctrl="ctrl" />
</template>
