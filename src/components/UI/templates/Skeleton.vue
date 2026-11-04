<script setup>
// Esqueleto de carga: variant "table" (filas), "cards" (tarjetas) o "form" (campos)
defineProps({ variant: { type: String, default: 'table' }, rows: { type: Number, default: 6 } })
</script>

<template>
  <div role="status" aria-label="Cargando" aria-busy="true">
    <div v-if="variant === 'table'">
      <div v-for="i in rows" :key="i" class="d-flex gap-3 py-2 border-bottom">
        <span class="skeleton flex-grow-1" style="height: 1.1rem" />
        <span class="skeleton" style="height: 1.1rem; width: 18%" />
        <span class="skeleton" style="height: 1.1rem; width: 12%" />
      </div>
    </div>
    <CRow v-else-if="variant === 'cards'">
      <CCol v-for="i in rows" :key="i" md="6" xl="4" class="mb-3"><span class="skeleton d-block" style="height: 120px; border-radius: 0.5rem" /></CCol>
    </CRow>
    <div v-else>
      <div v-for="i in rows" :key="i" class="mb-3">
        <span class="skeleton d-block mb-1" style="height: 0.8rem; width: 25%" />
        <span class="skeleton d-block" style="height: 2.3rem" />
      </div>
    </div>
    <span class="visually-hidden">Cargando...</span>
  </div>
</template>
