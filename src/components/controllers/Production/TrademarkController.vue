<script setup>
import View from '@/components/templates/Production/Trademark/Trademark.vue'
import { configuration } from '@/components/templates/Production/Trademark/configuration.vue'
import Model from '@/models/Trademark'
import Service from '@/services/TrademarkService'
import { useResourceController } from '@/composables/useResourceController'

const ctrl = useResourceController({ service: Service, Model, configuration })
</script>

<template>
  <View :ctrl="ctrl" />
</template>
