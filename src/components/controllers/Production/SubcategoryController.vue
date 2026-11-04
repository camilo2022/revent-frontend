<script setup>
import View from '@/components/templates/Production/Subcategory/Subcategory.vue'
import { configuration } from '@/components/templates/Production/Subcategory/configuration.vue'
import Model from '@/models/Subcategory'
import Service from '@/services/SubcategoryService'
import { useResourceController } from '@/composables/useResourceController'

const ctrl = useResourceController({ service: Service, Model, configuration })
</script>

<template>
  <View :ctrl="ctrl" />
</template>
