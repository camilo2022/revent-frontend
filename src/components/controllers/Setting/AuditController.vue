<script setup>
import View from '@/components/templates/Setting/Audit/Audit.vue'
import { configuration } from '@/components/templates/Setting/Audit/configuration.vue'
import Model from '@/models/Audit'
import Service from '@/services/AuditService'
import { useResourceController } from '@/composables/useResourceController'

const ctrl = useResourceController({ service: Service, Model, configuration })
</script>

<template>
  <View :ctrl="ctrl" />
</template>
