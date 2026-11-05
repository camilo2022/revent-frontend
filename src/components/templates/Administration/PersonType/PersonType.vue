<script setup>
import ResourceScreen from '@/components/UI/templates/ResourceScreen.vue'
import ChildPanel from '@/components/UI/templates/ChildPanel.vue'
import DocumentType from '@/models/DocumentType'
import DocumentTypeService from '@/services/DocumentTypeService'
import { configuration } from './configuration.vue'
import { personTypeConfiguration } from '@/components/templates/Administration/DocumentType/configuration.vue'

defineProps({ ctrl: { type: Object, required: true } })
</script>

<template>
  <ResourceScreen :ctrl="ctrl" :config="configuration">
    <template #panel="{ row, back }">
      <ChildPanel :parent="row" parent-key="person_type_id" parent-title="Tipos de persona" parent-label="Tipo de persona" :service="DocumentTypeService" :model="DocumentType" :config="personTypeConfiguration" @back="back" />
    </template>
  </ResourceScreen>
</template>
