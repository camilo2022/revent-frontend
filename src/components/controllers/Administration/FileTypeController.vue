<script setup>
import View from '@/components/templates/Administration/FileType/FileType.vue'
import { configuration } from '@/components/templates/Administration/FileType/configuration.vue'
import Model from '@/models/FileType'
import Service from '@/services/FileTypeService'
import { useResourceController } from '@/composables/useResourceController'

const ctrl = useResourceController({ service: Service, Model, configuration })
</script>

<template>
  <View :ctrl="ctrl" />
</template>
