<script setup>
defineProps({ text: { type: String, default: 'No hay registros para mostrar.' } })
</script>

<template>
  <div class="empty-state text-center text-body-secondary py-5">
    <!-- Ilustración sencilla: carpeta vacía -->
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none" aria-hidden="true" class="mb-3">
      <rect x="10" y="26" width="76" height="52" rx="8" fill="var(--revent-primary)" opacity=".12" />
      <path d="M10 34a8 8 0 0 1 8-8h18l8 8h34a8 8 0 0 1 8 8v28a8 8 0 0 1-8 8H18a8 8 0 0 1-8-8V34Z" stroke="var(--revent-primary)" stroke-width="3" />
      <path d="M38 58h20" stroke="var(--revent-primary)" stroke-width="3" stroke-linecap="round" />
    </svg>
    <div class="fw-semibold">{{ text }}</div>
    <slot />
  </div>
</template>
