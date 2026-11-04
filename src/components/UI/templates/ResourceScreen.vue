<script setup>
import { computed } from 'vue'
import ResourceForm from './ResourceForm.vue'
import ResourceIndex from './ResourceIndex.vue'
import ResourceShow from './ResourceShow.vue'

// Orquesta los paneles de un recurso según ctrl.mode.
// Slots para recursos con lógica propia: form, show, filters, panel (otros modos, ej. permisos).
const props = defineProps({ ctrl: { type: Object, required: true }, config: { type: Object, required: true } })

const isForm = computed(() => ['create', 'edit'].includes(props.ctrl.mode))
const modal = computed(() => isForm.value && props.config.formMode === 'modal')
const heading = computed(() => `${props.ctrl.mode === 'edit' ? 'Editar' : 'Nuevo'} ${props.config.singular}`)
</script>

<template>
  <Transition name="panel" mode="out-in">
    <!-- Lista (queda de fondo cuando el formulario es un modal) -->
    <div v-if="ctrl.mode === 'index' || modal" key="index">
      <ResourceIndex :ctrl="ctrl" :config="config"><template #filters><slot name="filters" /></template></ResourceIndex>
    </div>

    <div v-else-if="isForm" key="form">
      <slot name="form" :ctrl="ctrl">
        <CCard class="fade-in">
          <CCardHeader><strong>{{ heading }}</strong></CCardHeader>
          <CCardBody><ResourceForm :ctrl="ctrl" :config="config" /></CCardBody>
        </CCard>
      </slot>
    </div>

    <div v-else-if="ctrl.mode === 'show'" key="show">
      <slot name="show" :ctrl="ctrl"><ResourceShow :ctrl="ctrl" :config="config" /></slot>
    </div>

    <div v-else :key="ctrl.mode">
      <slot name="panel" :ctrl="ctrl" :row="ctrl.current" :mode="ctrl.mode" :back="ctrl.goIndex" />
    </div>
  </Transition>

  <CModal v-if="config.formMode === 'modal'" :visible="modal" alignment="center" backdrop="static" @close="ctrl.goIndex()">
    <CModalHeader><CModalTitle>{{ heading }}</CModalTitle></CModalHeader>
    <CModalBody><ResourceForm :ctrl="ctrl" :config="config" /></CModalBody>
  </CModal>
</template>
