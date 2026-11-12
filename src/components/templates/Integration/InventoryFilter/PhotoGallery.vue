<script setup>
import { computed, ref, watch } from 'vue'
import InventoryFilterService from '@/services/integration/InventoryFilterService'
import { errorMessage } from '@/utils/format'
import { photoUrl } from '../photoUrl'

// Fotos de una referencia, de 12 en 12. Se abre en el color elegido; las páginas se piden a la API al navegar.
const visible = defineModel('visible', { default: false })
const props = defineProps({ referencia: String, nombre: String, color: String })

const photos = ref([])
const page = ref(1)
const lastPage = ref(1)
const total = ref(0)
const selected = ref(0)
const loading = ref(false)
const error = ref('')

const load = async (target = 1, start = 0, byColor = false) => {
  loading.value = true
  error.value = ''
  try {
    const res = await InventoryFilterService.images(props.referencia, target, 12)
    const data = res.data.images
    photos.value = data.images
    page.value = data.page
    lastPage.value = data.last_page
    total.value = data.total
    // Al abrir, si hay una foto del color elegido se muestra esa primero
    const found = byColor && props.color ? data.images.findIndex((p) => p.name.toLowerCase().includes(props.color.toLowerCase())) : -1
    selected.value = found >= 0 ? found : Math.min(start, Math.max(0, data.images.length - 1))
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}

// Al abrir se empieza por la primera página
watch(visible, (open) => open && props.referencia && load(1, 0, true), { immediate: true })

const current = computed(() => photos.value[selected.value] ?? null)
const move = (step) => {
  const next = selected.value + step
  if (next >= 0 && next < photos.value.length) selected.value = next
  else if (next < 0 && page.value > 1) load(page.value - 1, 11)
  else if (next >= photos.value.length && page.value < lastPage.value) load(page.value + 1, 0)
}
</script>

<template>
  <CModal teleport :visible="visible" size="lg" alignment="center" scrollable @close="visible = false">
    <CModalHeader><CModalTitle>{{ referencia }} · {{ nombre }} <span v-if="color" class="text-body-secondary fs-6">· {{ color }}</span></CModalTitle></CModalHeader>
    <CModalBody>
      <div v-if="loading" class="text-center py-5"><CSpinner /></div>
      <CAlert v-else-if="error" color="danger" class="mb-0">{{ error }}</CAlert>
      <div v-else-if="!current" class="text-center text-body-secondary py-5">Esta referencia no tiene fotos.</div>
      <template v-else>
        <div class="d-flex align-items-center justify-content-between gap-2">
          <CButton color="secondary" variant="outline" aria-label="Foto anterior" :disabled="selected === 0 && page === 1" @click="move(-1)">‹</CButton>
          <img :src="photoUrl(current.url)" :alt="current.name" class="img-fluid rounded" style="max-height: 60vh; object-fit: contain" />
          <CButton color="secondary" variant="outline" aria-label="Foto siguiente" :disabled="selected === photos.length - 1 && page === lastPage" @click="move(1)">›</CButton>
        </div>
        <div class="text-center small text-body-secondary mt-2">{{ current.name }} · foto {{ (page - 1) * 12 + selected + 1 }} de {{ total }}</div>
        <div class="d-flex flex-wrap justify-content-center gap-2 mt-3">
          <button v-for="(p, i) in photos" :key="p.name" type="button" :class="['btn p-0 border rounded-2 overflow-hidden', i === selected ? 'border-primary border-2' : '']" style="width: 64px; height: 64px" :aria-label="`Ver ${p.name}`" @click="selected = i">
            <img :src="photoUrl(p.url)" :alt="p.name" loading="lazy" style="width: 100%; height: 100%; object-fit: cover" />
          </button>
        </div>
      </template>
    </CModalBody>
  </CModal>
</template>
