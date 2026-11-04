<script setup>
import OrderForm from './OrderForm.vue'
defineProps({ id: String })
</script>

<template>
  <OrderForm :id="id" :key="id" />
</template>
