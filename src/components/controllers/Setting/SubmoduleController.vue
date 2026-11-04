<script setup>
import View from '@/components/templates/Setting/Submodule/Submodule.vue'
import { configuration } from '@/components/templates/Setting/Submodule/configuration.vue'
import Model from '@/models/Submodule'
import Service from '@/services/SubmoduleService'
import { useResourceController } from '@/composables/useResourceController'

// Submódulos de un módulo: el id del módulo va fijo en la lista y en el cuerpo
const props = defineProps({ module: { type: Object, required: true } })
defineEmits(['back'])

const ctrl = useResourceController({ service: Service, Model, configuration, fixed: () => ({ module_id: props.module.id }) })
</script>

<template>
  <div>
    <div class="d-flex align-items-center gap-3 mb-3">
      <CButton color="secondary" variant="outline" size="sm" @click="$emit('back')">&larr; Módulos</CButton>
      <h5 class="mb-0">Módulo: {{ module.name }}</h5>
    </div>
    <View :ctrl="ctrl" />
  </div>
</template>
