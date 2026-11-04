<script setup>
import View from '@/components/templates/Production/Size/Size.vue'
import { configuration } from '@/components/templates/Production/Size/configuration.vue'
import Model from '@/models/Size'
import Service from '@/services/SizeService'
import { useResourceController } from '@/composables/useResourceController'

const ctrl = useResourceController({ service: Service, Model, configuration })
</script>

<template>
  <View :ctrl="ctrl" />
</template>
