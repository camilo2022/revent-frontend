<script setup>
import View from '@/components/templates/Administration/DocumentType/DocumentType.vue'
import { configuration } from '@/components/templates/Administration/DocumentType/configuration.vue'
import Model from '@/models/DocumentType'
import Service from '@/services/DocumentTypeService'
import { useResourceController } from '@/composables/useResourceController'

const ctrl = useResourceController({ service: Service, Model, configuration })
</script>

<template>
  <View :ctrl="ctrl" />
</template>
