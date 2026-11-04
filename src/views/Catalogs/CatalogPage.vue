<script setup>
import { computed } from 'vue'
import CatalogCrud from '@/components/CatalogCrud.vue'
import catalogs from './catalogs.config'

const props = defineProps({ catalog: { type: String, required: true } })
const config = computed(() => catalogs[props.catalog])
</script>

<template>
  <!-- La clave reinicia el componente al cambiar de catálogo -->
  <CatalogCrud :key="catalog" :config="config" />
</template>
