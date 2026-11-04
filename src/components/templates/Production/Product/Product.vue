<script setup>
import ResourceScreen from '@/components/UI/templates/ResourceScreen.vue'
import Form from './Form.vue'
import Show from './Show.vue'
import { configuration } from './configuration.vue'

defineProps({ ctrl: { type: Object, required: true } })
</script>

<template>
  <ResourceScreen :ctrl="ctrl" :config="configuration">
    <template #filters>
      <CFormSelect v-model="ctrl.filters.collection_id" style="max-width: 220px" aria-label="Todas las colecciones" @change="ctrl.refresh()">
        <option value="">Todas las colecciones</option>
        <option v-for="o in ctrl.options.collections" :key="o.id" :value="o.id">{{ o.name }}</option>
      </CFormSelect>
    </template>
    <template #form="{ ctrl: c }">
      <Form :id="c.current?.id" @saved="c.saved(true)" @cancel="c.goIndex()" />
    </template>
    <template #show="{ ctrl: c }">
      <Show :id="c.current.id" @edit="c.goEdit(c.current)" @back="c.goIndex()" @open="(id) => c.goShow({ id })" />
    </template>
  </ResourceScreen>
</template>
