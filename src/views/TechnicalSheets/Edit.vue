<script setup>
import TechnicalSheetForm from './TechnicalSheetForm.vue'
defineProps({ id: String })
</script>

<template>
  <TechnicalSheetForm :id="id" :key="id" />
</template>
