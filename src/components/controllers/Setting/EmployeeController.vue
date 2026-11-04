<script setup>
import View from '@/components/templates/Setting/Employee/Employee.vue'
import { configuration } from '@/components/templates/Setting/Employee/configuration.vue'
import Model from '@/models/Employee'
import Service from '@/services/EmployeeService'
import { useResourceController } from '@/composables/useResourceController'

const ctrl = useResourceController({ service: Service, Model, configuration })
</script>

<template>
  <View :ctrl="ctrl" />
</template>
