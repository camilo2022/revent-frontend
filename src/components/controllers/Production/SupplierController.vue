<script setup>
import View from '@/components/templates/Production/Supplier/Supplier.vue'
import { configuration } from '@/components/templates/Production/Supplier/configuration.vue'
import Model from '@/models/Supplier'
import Service from '@/services/SupplierService'
import { useResourceController } from '@/composables/useResourceController'

const ctrl = useResourceController({ service: Service, Model, configuration })
</script>

<template>
  <View :ctrl="ctrl" />
</template>
