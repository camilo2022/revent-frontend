<script setup>
import { cilTrash } from '@coreui/icons'
import EmptyState from '@/components/UI/templates/EmptyState.vue'

// Cuadrícula de fotos (nombre, peso y botón de eliminar). Al hacer clic en la foto se abre en grande en otra pestaña.
defineProps({
  photos: { type: Array, default: () => [] },
  canDelete: Boolean,
  busy: String, // nombre de la foto que se está eliminando
  emptyText: { type: String, default: 'No hay fotos cargadas todavía.' },
})
const emit = defineEmits(['delete'])

const size = (bytes) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`)
</script>

<template>
  <EmptyState v-if="!photos.length" :text="emptyText" />
  <div v-else class="photo-grid">
    <figure v-for="photo in photos" :key="photo.name" class="photo-card border rounded-3 overflow-hidden m-0">
      <a :href="photo.url" target="_blank" rel="noopener" class="d-block bg-body-tertiary">
        <img :src="photo.url" :alt="photo.name" loading="lazy" class="photo-img" />
      </a>
      <figcaption class="d-flex align-items-center justify-content-between gap-2 p-2">
        <small class="text-body-secondary text-truncate" :title="photo.name">{{ size(photo.size) }}</small>
        <CButton
          v-if="canDelete"
          color="danger"
          variant="ghost"
          size="sm"
          :disabled="busy === photo.name"
          :aria-label="`Eliminar ${photo.name}`"
          @click="emit('delete', photo)"
        >
          <CSpinner v-if="busy === photo.name" size="sm" />
          <CIcon v-else :icon="cilTrash" />
        </CButton>
      </figcaption>
    </figure>
  </div>
</template>

<style scoped>
.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.75rem;
}
.photo-img {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}
</style>
