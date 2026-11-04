<script setup>
import { computed } from 'vue'

// Pie de tabla: resumen, tamaño de página y páginas. `pagination` viene del controlador.
const props = defineProps({ pagination: { type: Object, required: true } })
const emit = defineEmits(['page', 'per-page'])

const pages = computed(() => {
  const { current_page: c, total_pages: t } = props.pagination
  const from = Math.max(1, c - 2)
  const to = Math.min(t, c + 2)
  return Array.from({ length: to - from + 1 }, (_, i) => from + i)
})
const summary = computed(() => {
  const { total, count, current_page, per_page } = props.pagination
  if (total == null) return `Página ${current_page}`
  const start = total ? (current_page - 1) * per_page + 1 : 0
  return `Mostrando ${start}-${start + count - (count ? 1 : 0)} de ${total}`
})
</script>

<template>
  <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
    <small class="text-body-secondary">{{ summary }}</small>
    <div class="d-flex align-items-center gap-3">
      <label class="d-flex align-items-center gap-2 small text-body-secondary mb-0">
        Por página
        <CFormSelect size="sm" :model-value="pagination.per_page" style="width: 80px" aria-label="Registros por página" @update:model-value="emit('per-page', $event)">
          <option v-for="s in pagination.sizes" :key="s" :value="s">{{ s }}</option>
        </CFormSelect>
      </label>
      <CPagination class="mb-0" size="sm" aria-label="Paginación">
        <CPaginationItem :disabled="pagination.current_page <= 1" @click="emit('page', pagination.current_page - 1)">&laquo;</CPaginationItem>
        <CPaginationItem v-for="p in pages" :key="p" :active="p === pagination.current_page" @click="emit('page', p)">{{ p }}</CPaginationItem>
        <CPaginationItem :disabled="pagination.current_page >= pagination.total_pages" @click="emit('page', pagination.current_page + 1)">&raquo;</CPaginationItem>
      </CPagination>
    </div>
  </div>
</template>
