<script setup>
import { cilArrowLeft } from '@coreui/icons'
import { computed, onMounted, ref } from 'vue'
import UserService from '@/services/UserService'
import PositionService from '@/services/PositionService'
import CategoryService from '@/services/CategoryService'
import PermissionService from '@/services/PermissionService'
import SubcategoryService from '@/services/SubcategoryService'
import { useAuthStore } from '@/stores/authStore'
import { useAlertStore } from '@/stores/alertStore'
import { errorMessage, firstOf, listOf } from '@/utils/format'
import CheckList from './CheckList.vue'
import Skeleton from './Skeleton.vue'

// Asignar/quitar permisos (usuarios, cargos) o subcategorías (categorías) con casillas.
// Cada casilla llama a la API de inmediato (assign / remove).
const props = defineProps({ kind: { type: String, required: true }, record: { type: Object, required: true } })
defineEmits(['back'])
const auth = useAuthStore()
const alerts = useAlertStore()

const kinds = {
  users: { title: 'Permisos del usuario', service: UserService, field: 'permission_id', allService: PermissionService, allKey: 'permissions', perm: 'users.authorization', name: (e) => e.username },
  positions: { title: 'Permisos del cargo', service: PositionService, field: 'permission_id', allService: PermissionService, allKey: 'permissions', perm: 'organizational_structure.areas.positions.authorization', name: (e) => e.name },
  categories: { title: 'Subcategorías de la categoría', service: CategoryService, field: 'subcategory_id', allService: SubcategoryService, allKey: 'subcategories', perm: 'classification.categories.subcategories', name: (e) => e.name },
}
const k = kinds[props.kind]

const entity = ref(null)
const items = ref([])
const selected = ref([])
const busy = ref(false)
const loading = ref(true)
const canEdit = computed(() => auth.can(`${k.perm}.assign`) && auth.can(`${k.perm}.remove`))

onMounted(async () => {
  try {
    entity.value = firstOf(await k.service.find(props.record.id))
    selected.value = (entity.value[k.allKey] ?? []).map((x) => x.id)
    const all = listOf(await k.allService.all(props.kind === 'categories' ? { with_trashed: 0 } : {}), k.allKey)
    // Permisos agrupados por rol; subcategorías sin grupo
    items.value = all.map((x) => ({
      id: x.id,
      label: k.allKey === 'permissions' ? `${x.title} (${x.name})` : x.name,
      group: k.allKey === 'permissions' ? x.role?.title ?? x.role?.name ?? 'Sin rol' : '',
    }))
  } catch (error) {
    alerts.error(errorMessage(error))
  }
  loading.value = false
})

// Aplica un cambio en el servidor y actualiza la selección local
const apply = async (item, checked) => {
  const body = { [k.field]: item.id }
  if (checked) await k.service.assign(props.record.id, body)
  else await k.service.remove(props.record.id, body)
  selected.value = checked ? [...selected.value, item.id] : selected.value.filter((x) => x !== item.id)
}

const run = async (list, checked) => {
  if (!canEdit.value) return
  busy.value = true
  alerts.muted = true
  try {
    for (const item of list) {
      if (selected.value.includes(item.id) !== checked) await apply(item, checked)
    }
    alerts.success('Cambios guardados')
  } catch (error) {
    alerts.error(errorMessage(error))
  } finally {
    alerts.muted = false
    busy.value = false
  }
}
</script>

<template>
  <CCard class="fade-in">
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <strong>{{ k.title }}: {{ k.name(record) }}</strong>
      <CButton color="secondary" variant="outline" size="sm" @click="$emit('back')"><CIcon :icon="cilArrowLeft" /> Volver</CButton>
    </CCardHeader>
    <CCardBody>
      <Skeleton v-if="loading" variant="form" />
      <template v-else>
        <p v-if="!canEdit" class="text-body-secondary">No tienes permiso para modificar estas asignaciones.</p>
        <CheckList :items="items" :selected="selected" :busy="busy || !canEdit" @toggle="(i, c) => run([i], c)" @toggle-group="run" />
      </template>
    </CCardBody>
  </CCard>
</template>
