<script setup>
import ResourceScreen from '@/components/UI/templates/ResourceScreen.vue'
import { usePermissions } from '@/composables/usePermissions'
import Form from './Form.vue'
import Show from './Show.vue'
import { configuration } from './configuration.vue'

const props = defineProps({ ctrl: { type: Object, required: true } })
const { can } = usePermissions()

const onlyMine = (value) => {
  props.ctrl.filters.mine = value ? 1 : ''
  props.ctrl.refresh()
}
</script>

<template>
  <ResourceScreen :ctrl="ctrl" :config="configuration">
    <!-- Quien ve todas puede volver a ver solo las suyas -->
    <template #filters>
      <CFormSwitch v-if="can('requisitions.view_all')" :model-value="!!ctrl.filters.mine" label="Solo mis solicitudes" @update:model-value="onlyMine" />
    </template>
    <template #form="{ ctrl: c }">
      <!-- Al guardar o volver se recarga la lista para que refleje el cambio -->
      <Form :id="c.current?.id" @saved="(id) => { c.load(); c.goShow({ id }) }" @cancel="c.goIndex()" />
    </template>
    <template #show="{ ctrl: c }">
      <Show :id="c.current.id" @edit="c.goEdit(c.current)" @back="() => { c.goIndex(); c.load() }" />
    </template>
  </ResourceScreen>
</template>
