<script setup>
import { onMounted, reactive } from 'vue'
import Swal from 'sweetalert2'
import { cilPencil, cilPlus, cilReload, cilSearch, cilTrash } from '@coreui/icons'
import { useCrud } from '@/composables/useCrud'
import { usePermissions } from '@/composables/usePermissions'
import { confirmAction, notify } from '@/utils/swal'
import { errorMessage, fileUrl } from '@/utils/format'
import { getPath } from '@/utils/paths'
import DataTable from '@/components/DataTable.vue'
import { useResource } from './resourceConfig'

// Lista genérica guiada por configuración (resources.config.js)
const props = defineProps({ resource: { type: String, required: true } })
const { can } = usePermissions()
const { config, base, fixed, perm } = useResource(props.resource)

// with_trashed es obligatorio en recursos con borrado lógico; los demás filtros vienen de la config
const filters = reactive({ ...(config.withTrashed ? { with_trashed: false } : {}), ...Object.fromEntries((config.filters ?? []).map((f) => [f.key, false])), ...fixed.value })
const crud = useCrud(config.service, config.listKey, { extra: filters, column: config.sortColumn ?? 'id' })

const cellValue = (row, col) => (col.value ? col.value(row) : getPath(row, col.key)) ?? '-'

const remove = async (row) => {
  if (!(await confirmAction({ title: `¿Eliminar ${config.singular}?`, confirmText: 'Sí, eliminar', icon: 'warning' }))) return
  try {
    await config.service.delete(row.id)
    notify('Eliminado correctamente')
    crud.load()
  } catch (error) {
    Swal.fire({ icon: 'error', title: 'No se pudo eliminar', text: errorMessage(error) })
  }
}
const restore = async (row) => {
  if (!(await confirmAction({ title: `¿Restaurar ${config.singular}?` }))) return
  try {
    await config.service.restore(row.id)
    notify('Restaurado correctamente')
    crud.load()
  } catch (error) {
    Swal.fire({ icon: 'error', title: 'No se pudo restaurar', text: errorMessage(error) })
  }
}

onMounted(crud.load)
</script>

<template>
  <CCard>
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <strong>{{ config.title }}</strong>
      <RouterLink v-if="!config.readonly && can(perm('store'))" :to="`${base}/create`">
        <CButton color="primary" size="sm"><CIcon :icon="cilPlus" /> Nuevo</CButton>
      </RouterLink>
    </CCardHeader>
    <CCardBody>
      <DataTable
        :columns="config.columns"
        :rows="crud.items.value"
        :loading="crud.loading.value"
        :pagination="crud.pagination.value"
        :search="crud.query.search"
        :searchable="!config.noSearch"
        :sort-column="crud.query.column"
        :sort-dir="crud.query.dir"
        @update:search="crud.setSearch"
        @page="crud.setPage"
        @sort="crud.sortBy"
      >
        <template #filters>
          <CFormSwitch v-if="config.withTrashed" v-model="filters.with_trashed" label="Ver inactivos" @change="crud.refresh" />
          <CFormSwitch v-for="f in config.filters" :key="f.key" v-model="filters[f.key]" :label="f.label" @change="crud.refresh" />
        </template>

        <template v-for="col in config.columns" :key="col.key" #[`cell-${col.key}`]="{ row }">
          <img v-if="col.type === 'photo'" :src="fileUrl(row.photo)" alt="" class="rounded-circle border" style="width: 36px; height: 36px; object-fit: cover" @error="$event.target.style.visibility = 'hidden'" />
          <template v-else>
            {{ cellValue(row, col) }}
            <CBadge v-if="col === config.columns[0] && row.deleted_at" color="secondary" class="ms-1">Inactivo</CBadge>
          </template>
        </template>

        <template #actions="{ row }">
          <RouterLink v-if="config.show && can(perm('find'))" :to="`${base}/${row.id}`">
            <CButton color="info" variant="outline" size="sm" class="me-1" title="Ver"><CIcon :icon="cilSearch" /></CButton>
          </RouterLink>
          <template v-if="row.deleted_at">
            <CButton v-if="can(perm('restore'))" color="success" variant="outline" size="sm" @click="restore(row)"><CIcon :icon="cilReload" /> Restaurar</CButton>
          </template>
          <template v-else-if="!config.readonly">
            <template v-for="a in config.extraActions" :key="a.label">
              <RouterLink v-if="can(a.permission)" :to="a.to(row, base)">
                <CButton color="info" variant="outline" size="sm" class="me-1">{{ a.label }}</CButton>
              </RouterLink>
            </template>
            <RouterLink v-if="can(perm('update'))" :to="`${base}/${row.id}/edit`">
              <CButton color="primary" variant="outline" size="sm" class="me-1" title="Editar"><CIcon :icon="cilPencil" /></CButton>
            </RouterLink>
            <CButton v-if="!config.noDelete && can(perm('delete'))" color="danger" variant="outline" size="sm" title="Eliminar" @click="remove(row)"><CIcon :icon="cilTrash" /></CButton>
          </template>
        </template>
      </DataTable>
    </CCardBody>
  </CCard>
</template>
