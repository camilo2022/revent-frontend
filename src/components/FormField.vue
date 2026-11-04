<script setup>
// Etiqueta + control + mensaje de error del servidor
defineProps({ label: String, error: String, required: Boolean, hint: String })
</script>

<template>
  <div class="mb-3">
    <label v-if="label" class="form-label">
      {{ label }}<span v-if="required" class="text-danger" aria-label="obligatorio"> *</span>
    </label>
    <slot />
    <div v-if="hint && !error" class="form-text">{{ hint }}</div>
    <div v-if="error" class="invalid-feedback d-block">{{ error }}</div>
  </div>
</template>
