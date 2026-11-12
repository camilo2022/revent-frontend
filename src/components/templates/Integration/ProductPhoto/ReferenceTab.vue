<script setup>
import { computed, ref } from 'vue'
import { cilCloudUpload, cilSearch } from '@coreui/icons'
import ProductPhotoService from '@/services/integration/ProductPhotoService'
import { useAuthStore } from '@/stores/authStore'
import { useAlertStore } from '@/stores/alertStore'
import { useServerErrors } from '@/composables/useServerErrors'
import { confirmAction } from '@/utils/swal'
import Button from '@/components/UI/templates/Button.vue'
import FormField from '@/components/UI/templates/FormField.vue'
import MultiFileInput from '@/components/UI/templates/MultiFileInput.vue'
import PhotoGrid from './PhotoGrid.vue'

// Por referencia: se busca la carpeta del producto, se ven sus fotos, se suben nuevas (se convierten a WebP) y se eliminan.
const auth = useAuthStore()
const alerts = useAlertStore()
const { get, errors, handle, clear } = useServerErrors()

const referencia = ref('')
const found = ref(null) // { referencia, exists, photos } o null si aún no se busca
const photos = ref([])
const busy = ref('') // '', 'search' o 'upload'
const deleting = ref('')

const canUpload = computed(() => auth.can('integration.product_photos.upload'))
const canDelete = computed(() => auth.can('integration.product_photos.delete'))
const photoErrors = computed(() => Object.entries(errors.value).filter(([key]) => key.startsWith('photos')).flatMap(([, list]) => list))

const search = async () => {
  clear()
  busy.value = 'search'
  alerts.muted = true // buscar no es una escritura
  try {
    const data = (await ProductPhotoService.search(referencia.value.trim())).data
    found.value = { referencia: data.referencia, exists: data.exists }
    photos.value = data.photos ?? []
  } catch (error) {
    found.value = null
    handle(error)
  } finally {
    alerts.muted = false
    busy.value = ''
  }
}

const selected = ref([])
const upload = async () => {
  clear()
  busy.value = 'upload'
  try {
    await ProductPhotoService.upload({ referencia: found.value.referencia, photos: selected.value })
    selected.value = []
    await refresh()
  } catch (error) {
    handle(error)
  } finally {
    busy.value = ''
  }
}

const refresh = async () => {
  alerts.muted = true
  try {
    const data = (await ProductPhotoService.search(found.value.referencia)).data
    found.value = { referencia: data.referencia, exists: data.exists }
    photos.value = data.photos ?? []
  } finally {
    alerts.muted = false
  }
}

const remove = async (photo) => {
  if (!(await confirmAction({ title: '¿Eliminar esta foto?', text: 'Esta acción no se puede deshacer.', confirmText: 'Sí, eliminar', icon: 'warning' }))) return
  deleting.value = photo.name
  try {
    await ProductPhotoService.remove({ referencia: found.value.referencia, filename: photo.name })
    photos.value = photos.value.filter((item) => item.name !== photo.name)
  } catch (error) {
    handle(error)
  } finally {
    deleting.value = ''
  }
}
</script>

<template>
  <div>
    <form novalidate @submit.prevent="search">
      <FormField label="Referencia" required :error="get('referencia')" hint="Ingresa la referencia del producto para gestionar sus fotos.">
        <div class="d-flex gap-2">
          <input v-model="referencia" type="text" class="form-control" placeholder="Ej: VAMPELT" autocomplete="off" />
          <Button type="submit" :loading="busy === 'search'" :disabled="!referencia.trim()" permission="integration.product_photos.search" :icon="cilSearch">Buscar</Button>
        </div>
      </FormField>
    </form>

    <template v-if="found">
      <h6 class="text-body-secondary mt-4">Fotos de {{ found.referencia }}</h6>
      <PhotoGrid :photos="photos" :can-delete="canDelete" :busy="deleting" empty-text="No hay fotos cargadas para esta referencia todavía." @delete="remove" />

      <template v-if="canUpload">
        <h6 class="text-body-secondary mt-4">Subir fotos</h6>
        <p class="small text-body-secondary">Puedes elegir varias a la vez (JPG, PNG o WEBP, máximo 10 MB cada una). Se convierten a WebP automáticamente.</p>
        <MultiFileInput v-model="selected" :max-mb="10" :max="30" :invalid="!!photoErrors.length" @rejected="alerts.warning" />
        <ul v-if="photoErrors.length" class="invalid-feedback d-block mt-2 mb-0 ps-3">
          <li v-for="(message, i) in photoErrors" :key="i">{{ message }}</li>
        </ul>
        <div class="mt-3">
          <Button :loading="busy === 'upload'" :disabled="!selected.length" permission="integration.product_photos.upload" :icon="cilCloudUpload" @click="upload">
            Subir {{ selected.length || '' }} {{ selected.length === 1 ? 'foto' : 'fotos' }}
          </Button>
        </div>
      </template>
    </template>
  </div>
</template>
