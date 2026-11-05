<script setup>
import ResourceScreen from '@/components/UI/templates/ResourceScreen.vue'
import ChildPanel from '@/components/UI/templates/ChildPanel.vue'
import Subcategory from '@/models/Subcategory'
import SubcategoryService from '@/services/SubcategoryService'
import { configuration } from './configuration.vue'
import { categoryConfiguration } from '@/components/templates/Production/Subcategory/configuration.vue'

defineProps({ ctrl: { type: Object, required: true } })
</script>

<template>
  <ResourceScreen :ctrl="ctrl" :config="configuration">
    <template #panel="{ row, back }">
      <ChildPanel :parent="row" parent-key="category_id" parent-title="Categorías" parent-label="Categoría" :parent-name="(p) => p.name" :service="SubcategoryService" :model="Subcategory" :config="categoryConfiguration" @back="back" />
    </template>
  </ResourceScreen>
</template>
