<script setup>
import View from '@/components/templates/Production/Category/Category.vue'
import { configuration } from '@/components/templates/Production/Category/configuration.vue'
import Model from '@/models/Category'
import Service from '@/services/CategoryService'
import { useResourceController } from '@/composables/useResourceController'

const ctrl = useResourceController({ service: Service, Model, configuration })
</script>

<template>
  <View :ctrl="ctrl" />
</template>
