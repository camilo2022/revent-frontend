<script setup>
import View from '@/components/templates/Production/Product/Product.vue'
import { configuration } from '@/components/templates/Production/Product/configuration.vue'
import Model from '@/models/Product'
import Service from '@/services/ProductService'
import { useResourceController } from '@/composables/useResourceController'

const ctrl = useResourceController({ service: Service, Model, configuration })
</script>

<template>
  <View :ctrl="ctrl" />
</template>
