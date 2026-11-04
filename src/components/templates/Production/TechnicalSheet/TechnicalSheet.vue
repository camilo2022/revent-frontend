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
      <CFormSelect v-model="ctrl.filters.status" style="max-width: 180px" aria-label="Estado" @change="ctrl.refresh()">
        <option value="">Todos los estados</option>
        <option v-for="[v, l] in configuration.statuses" :key="v" :value="v">{{ l }}</option>
      </CFormSelect>
      <CFormSelect v-model="ctrl.filters.product_id" style="max-width: 220px" aria-label="Todos los productos" @change="ctrl.refresh()">
        <option value="">Todos los productos</option>
        <option v-for="o in ctrl.options.products" :key="o.id" :value="o.id">{{ `${o.code} · ${o.name}` }}</option>
      </CFormSelect>
    </template>
    <template #form="{ ctrl: c }">
      <Form :id="c.current?.id" @saved="c.saved()" @cancel="c.goIndex()" />
    </template>
    <template #show="{ ctrl: c }">
      <Show :id="c.current.id" @edit="c.goEdit(c.current)" @back="c.goIndex()" @open="(id) => c.goShow({ id })" />
    </template>
  </ResourceScreen>
</template>
