<script setup>
import { computed, onMounted, ref } from 'vue'
import Swal from 'sweetalert2'
import { userService } from '@/services/user.service'
import { positionService } from '@/services/position.service'
import { categoryService } from '@/services/category.service'
import { permissionService } from '@/services/permission.service'
import { subcategoryService } from '@/services/subcategory.service'
import { usePermissions } from '@/composables/usePermissions'
import { errorMessage, firstOf, listOf } from '@/utils/format'
import { notify } from '@/utils/swal'
import CheckList from '@/components/CheckList.vue'
import LoadingForm from '@/components/LoadingForm.vue'

// Asignar/quitar permisos (usuarios, cargos) o subcategorías (categorías) con casillas.
// Cada casilla llama a la API de inmediato (assign / remove).
const props = defineProps({ kind: { type: String, required: true }, id: String })
const { can } = usePermissions()

const kinds = {
  users: { title: 'Permisos del usuario', service: userService, back: '/users', field: 'permission_id', allService: permissionService, allKey: 'permissions', ownKey: 'permissions', perm: 'users.authorization', name: (e) => e.username },
  positions: { title: 'Permisos del cargo', service: positionService, back: '/positions', field: 'permission_id', allService: permissionService, allKey: 'permissions', ownKey: 'permissions', perm: 'organizational_structure.areas.positions.authorization', name: (e) => e.name },
  categories: { title: 'Subcategorías de la categoría', service: categoryService, back: '/categories', field: 'subcategory_id', allService: subcategoryService, allKey: 'subcategories', ownKey: 'subcategories', perm: 'classification.categories.subcategories', name: (e) => e.name },
}
const k = kinds[props.kind]

const entity = ref(null)
const items = ref([])
const selected = ref([])
const busy = ref(false)
const loading = ref(true)

const canEdit = computed(() => can(`${k.perm}.assign`) && can(`${k.perm}.remove`))

onMounted(async () => {
  try {
    entity.value = firstOf(await k.service.find(props.id))
    selected.value = (entity.value[k.ownKey] ?? []).map((x) => x.id)
    const all = listOf(await k.allService.all(props.kind === 'categories' ? { with_trashed: 0 } : {}), k.allKey)
    // Permisos agrupados por rol; subcategorías sin grupo
    items.value = all.map((x) => ({
      id: x.id,
      label: k.allKey === 'permissions' ? `${x.title} (${x.name})` : x.name,
      group: k.allKey === 'permissions' ? x.role?.title ?? x.role?.name ?? 'Sin rol' : '',
    }))
  } catch (error) {
    Swal.fire({ icon: 'error', title: 'No se pudo cargar', text: errorMessage(error) })
  }
  loading.value = false
})

// Aplica un cambio en el servidor y actualiza la selección local
const apply = async (item, checked) => {
  const body = { [k.field]: item.id }
  if (checked) await k.service.assign(props.id, body)
  else await k.service.remove(props.id, body)
  selected.value = checked ? [...selected.value, item.id] : selected.value.filter((x) => x !== item.id)
}

const toggle = async (item, checked) => {
  if (!canEdit.value) return
  busy.value = true
  try {
    await apply(item, checked)
  } catch (error) {
    Swal.fire({ icon: 'error', title: 'No se pudo guardar', text: errorMessage(error) })
  } finally {
    busy.value = false
  }
}

// Marcar o quitar todo un grupo, uno por uno
const toggleGroup = async (list, checked) => {
  if (!canEdit.value) return
  busy.value = true
  try {
    for (const item of list) {
      if (selected.value.includes(item.id) !== checked) await apply(item, checked)
    }
    notify('Cambios guardados')
  } catch (error) {
    Swal.fire({ icon: 'error', title: 'No se pudo guardar', text: errorMessage(error) })
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <LoadingForm v-if="loading" />
  <CCard v-else>
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <strong>{{ k.title }}: {{ entity ? k.name(entity) : '' }}</strong>
      <RouterLink :to="k.back"><CButton color="secondary" variant="outline" size="sm">Volver</CButton></RouterLink>
    </CCardHeader>
    <CCardBody>
      <p v-if="!canEdit" class="text-body-secondary">No tienes permiso para modificar estas asignaciones.</p>
      <CheckList :items="items" :selected="selected" :busy="busy || !canEdit" @toggle="toggle" @toggle-group="toggleGroup" />
    </CCardBody>
  </CCard>
</template>
