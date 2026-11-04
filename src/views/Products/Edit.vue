<script setup>
import ProductForm from './ProductForm.vue'
defineProps({ id: String })
</script>

<template>
  <ProductForm :id="id" :key="id" />
</template>
