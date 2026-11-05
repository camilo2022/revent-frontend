<script setup>
import { cilArrowLeft } from '@coreui/icons'
import ResourceScreen from './ResourceScreen.vue'
import { useResourceController } from '@/composables/useResourceController'

// Registros hijos dentro de la pantalla del padre (permisos de un rol, tipos de documento de un tipo de persona…):
// la clave del padre va fija en la lista y en el cuerpo, igual que los submódulos de un módulo.
const props = defineProps({
  parent: { type: Object, required: true },
  parentKey: { type: String, required: true }, // ej. role_id
  parentTitle: { type: String, required: true }, // ej. Roles
  parentLabel: { type: String, required: true }, // ej. Rol
  parentName: { type: Function, default: (p) => p.title ?? p.name },
  service: { type: Object, required: true },
  model: { type: Function, required: true },
  config: { type: Object, required: true },
})
defineEmits(['back'])

const ctrl = useResourceController({ service: props.service, Model: props.model, configuration: props.config, fixed: () => ({ [props.parentKey]: props.parent.id }) })
</script>

<template>
  <div>
    <div class="d-flex align-items-center gap-3 mb-3">
      <CButton color="secondary" variant="outline" size="sm" @click="$emit('back')"><CIcon :icon="cilArrowLeft" /> {{ parentTitle }}</CButton>
      <h5 class="mb-0">{{ parentLabel }}: {{ parentName(parent) }}</h5>
    </div>
    <ResourceScreen :ctrl="ctrl" :config="config" />
  </div>
</template>
