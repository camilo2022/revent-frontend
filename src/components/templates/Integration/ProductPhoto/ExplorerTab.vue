<script setup>
import { computed, onMounted, ref } from 'vue'
import { cilCloudUpload, cilFolder, cilFolderOpen, cilPlus } from '@coreui/icons'
import ProductPhotoService from '@/services/integration/ProductPhotoService'
import { useAuthStore } from '@/stores/authStore'
import { useAlertStore } from '@/stores/alertStore'
import { useServerErrors } from '@/composables/useServerErrors'
import { useSiigoCredentials } from '@/composables/useSiigoCredentials'
import { errorMessage } from '@/utils/format'
import { confirmAction } from '@/utils/swal'
import Button from '@/components/UI/templates/Button.vue'
import EmptyState from '@/components/UI/templates/EmptyState.vue'
import FormField from '@/components/UI/templates/FormField.vue'
import MultiFileInput from '@/components/UI/templates/MultiFileInput.vue'
import Skeleton from '@/components/UI/templates/Skeleton.vue'
import SiigoCredentialNotice from '@/components/UI/templates/SiigoCredentialNotice.vue'
import PhotoGrid from './PhotoGrid.vue'

// Explorador: products / REFERENCIA / COLOR. Cada carpeta de primer nivel es un producto y dentro puede tener fotos o carpetas por color.
// Al subir fotos a un color se reemplaza la foto de esos productos en Siigo; al subirlas al producto se completan los que no tienen foto.
const auth = useAuthStore()
const alerts = useAlertStore()
const { get, errors, handle, clear } = useServerErrors()
const { ready: tokenReady } = useSiigoCredentials(['token'])

const data = ref(null)
const loading = ref(true)
const filter = ref('')
const deleting = ref('')
const uploading = ref(false)
const selected = ref([])
const siigoResult = ref(null)

const canFolder = computed(() => auth.can('integration.product_photos.explorer_folder'))
const canUpload = computed(() => auth.can('integration.product_photos.explorer_upload'))
const canDelete = computed(() => auth.can('integration.product_photos.explorer_delete'))
const level = computed(() => data.value?.level ?? 0)
const photoErrors = computed(() => Object.entries(errors.value).filter(([key]) => key.startsWith('photos')).flatMap(([, list]) => list))
const folders = computed(() => {
  const term = filter.value.trim().toLowerCase()
  return (data.value?.folders ?? []).filter((folder) => !term || folder.label.toLowerCase().includes(term))
})

const open = async (path = '') => {
  loading.value = true
  siigoResult.value = null
  selected.value = []
  filter.value = ''
  clear()
  alerts.muted = true // navegar no es una escritura
  try {
    data.value = (await ProductPhotoService.explorer(path)).data.explorer
  } catch (error) {
    alerts.error(errorMessage(error))
  } finally {
    alerts.muted = false
    loading.value = false
  }
}
onMounted(() => open(''))

// ---- Nueva carpeta: un producto en la raíz, un color dentro del producto
const folderModal = ref(false)
const folderName = ref('')
const creating = ref(false)

const openFolderModal = () => {
  if (level.value === 1 && !data.value.available_colors.length) {
    alerts.warning('Este producto ya tiene una carpeta para cada color.')
    return
  }
  folderName.value = ''
  clear()
  folderModal.value = true
}

const createFolder = async () => {
  creating.value = true
  clear()
  try {
    await ProductPhotoService.explorerFolder({ path: data.value.path, name: folderName.value.trim() })
    folderModal.value = false
    await open(data.value.path)
  } catch (error) {
    handle(error)
  } finally {
    creating.value = false
  }
}

// ---- Fotos
const upload = async () => {
  clear()
  uploading.value = true
  siigoResult.value = null
  try {
    const res = (await ProductPhotoService.explorerUpload({ path: data.value.path, photos: selected.value })).data.upload
    siigoResult.value = res.siigo
    selected.value = []
    const result = res.siigo
    await open(data.value.path)
    siigoResult.value = result
  } catch (error) {
    handle(error)
  } finally {
    uploading.value = false
  }
}

const remove = async (photo) => {
  if (!(await confirmAction({ title: '¿Eliminar esta foto?', text: 'Esta acción no se puede deshacer.', confirmText: 'Sí, eliminar', icon: 'warning' }))) return
  deleting.value = photo.name
  try {
    await ProductPhotoService.explorerDelete({ path: data.value.path, filename: photo.name })
    data.value.files = data.value.files.filter((item) => item.name !== photo.name)
  } catch (error) {
    handle(error)
  } finally {
    deleting.value = ''
  }
}

const summaryText = (summary = {}) => Object.entries(summary).map(([status, count]) => `${count} ${status}`).join(', ')
</script>

<template>
  <div>
    <p class="text-body-secondary">
      Explora <strong>products</strong>: cada carpeta es un producto y dentro puede tener fotos o carpetas por color.
    </p>

    <!-- Migas de pan -->
    <nav v-if="data" aria-label="Ruta" class="d-flex flex-wrap align-items-center gap-1 mb-3">
      <template v-for="(crumb, i) in data.breadcrumb" :key="crumb.path">
        <span v-if="i" class="text-body-secondary">/</span>
        <CButton v-if="i < data.breadcrumb.length - 1" color="link" size="sm" class="p-0" @click="open(crumb.path)">{{ crumb.label }}</CButton>
        <strong v-else>{{ crumb.label }}</strong>
      </template>
    </nav>

    <div class="d-flex flex-wrap gap-2 mb-3">
      <input v-if="level < 2" v-model="filter" type="search" class="form-control" style="max-width: 280px" placeholder="Filtrar carpetas..." autocomplete="off" />
      <Button v-if="level < 2 && canFolder" color="primary" variant="outline" permission="integration.product_photos.explorer_folder" :icon="cilPlus" @click="openFolderModal">
        {{ level === 0 ? 'Nuevo producto' : 'Nuevo color' }}
      </Button>
    </div>

    <Skeleton v-if="loading" />
    <template v-else-if="data">
      <!-- Carpetas -->
      <template v-if="level < 2">
        <EmptyState v-if="!folders.length" :text="filter ? 'Ninguna carpeta coincide con el filtro.' : level === 0 ? 'Aún no hay productos.' : 'Este producto aún no tiene carpetas de color.'" />
        <div v-else class="folder-grid mb-4">
          <button v-for="folder in folders" :key="folder.path" type="button" class="folder-card border rounded-3 p-3 text-start bg-body" @click="open(folder.path)">
            <span class="d-flex align-items-center gap-2 mb-1">
              <span v-if="folder.hex" class="swatch rounded-circle border" :style="{ background: folder.hex }" />
              <CIcon v-else :icon="cilFolder" class="text-warning" />
              <strong class="text-truncate">{{ folder.label }}</strong>
            </span>
            <small class="text-body-secondary d-block">
              {{ folder.counts.photos }} {{ folder.counts.photos === 1 ? 'foto' : 'fotos' }}<template v-if="folder.type === 'product'"> · {{ folder.counts.folders }} {{ folder.counts.folders === 1 ? 'color' : 'colores' }}</template>
            </small>
            <small v-if="folder.macro" class="text-body-secondary">{{ folder.macro }}</small>
          </button>
        </div>
      </template>

      <!-- Fotos de la carpeta actual -->
      <template v-if="level >= 1">
        <h6 class="text-body-secondary"><CIcon :icon="cilFolderOpen" class="me-1" />Fotos de esta carpeta</h6>
        <PhotoGrid :photos="data.files" :can-delete="canDelete" :busy="deleting" empty-text="Esta carpeta aún no tiene fotos." @delete="remove" />

        <template v-if="canUpload">
          <h6 class="text-body-secondary mt-4">Subir fotos a esta carpeta</h6>
          <SiigoCredentialNotice :kinds="['token']" />
          <p class="small text-body-secondary">
            JPG, PNG o WEBP, máximo 10 MB cada una.
            <template v-if="level === 2">La primera foto reemplaza la de los productos de este color en Siigo.</template>
            <template v-else>Se completan en Siigo los productos que no tengan foto.</template>
          </p>
          <MultiFileInput v-model="selected" :max-mb="10" :max="30" :invalid="!!photoErrors.length" @rejected="alerts.warning" />
          <ul v-if="photoErrors.length || get('token')" class="invalid-feedback d-block mt-2 mb-0 ps-3">
            <li v-if="get('token')">{{ get('token') }}</li>
            <li v-for="(message, i) in photoErrors" :key="i">{{ message }}</li>
          </ul>
          <div class="mt-3">
            <Button :loading="uploading" :disabled="!selected.length || !tokenReady" permission="integration.product_photos.explorer_upload" :icon="cilCloudUpload" @click="upload">
              Subir {{ selected.length || '' }} {{ selected.length === 1 ? 'foto' : 'fotos' }}
            </Button>
          </div>
        </template>

        <CAlert v-if="siigoResult" :color="siigoResult.success ? 'success' : 'warning'" class="mt-3 mb-0">
          <strong>Envío a Siigo:</strong>
          <span v-if="siigoResult.error"> {{ siigoResult.error }} Las fotos sí quedaron guardadas en el servidor.</span>
          <span v-else-if="siigoResult.message"> {{ siigoResult.message }}</span>
          <span v-else> {{ summaryText(siigoResult.summary) || 'Sin productos para actualizar.' }}</span>
        </CAlert>
      </template>
    </template>

    <!-- Nuevo producto / nuevo color -->
    <CModal teleport :visible="folderModal" alignment="center" backdrop="static" @close="folderModal = false">
      <CModalHeader><CModalTitle>{{ level === 0 ? 'Nuevo producto' : 'Nuevo color' }}</CModalTitle></CModalHeader>
      <CModalBody>
        <FormField v-if="level === 0" label="Referencia del producto" required :error="get('name')" hint="MAYÚSCULAS (se permite Ñ), números, guion o guion bajo.">
          <input v-model="folderName" type="text" class="form-control" placeholder="Ej: VAMPELT" autocomplete="off" @keyup.enter="createFolder" />
        </FormField>
        <FormField v-else label="Color" required :error="get('name') || get('path')">
          <select v-model="folderName" class="form-select">
            <option value="" disabled>Selecciona un color</option>
            <optgroup v-for="group in data?.available_colors ?? []" :key="group.macro" :label="group.macro">
              <option v-for="item in group.items" :key="item.carpeta" :value="item.carpeta">{{ item.nombre }}</option>
            </optgroup>
          </select>
        </FormField>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="outline" @click="folderModal = false">Cancelar</CButton>
        <Button :loading="creating" :disabled="!folderName.trim()" @click="createFolder">Crear carpeta</Button>
      </CModalFooter>
    </CModal>
  </div>
</template>

<style scoped>
.folder-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.75rem;
}
.folder-card {
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.folder-card:hover {
  border-color: var(--revent-primary) !important;
  box-shadow: 0 2px 8px rgb(0 0 0 / 8%);
}
.swatch {
  display: inline-block;
  width: 18px;
  height: 18px;
  flex: none;
}
</style>
