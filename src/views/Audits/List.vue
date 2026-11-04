<script setup>
import { onMounted, reactive, ref } from 'vue'
import { cilSearch } from '@coreui/icons'
import { auditService } from '@/services/audit.service'
import { userService } from '@/services/user.service'
import { useCrud } from '@/composables/useCrud'
import { usePermissions } from '@/composables/usePermissions'
import DataTable from '@/components/DataTable.vue'
import RemoteSelect from '@/components/RemoteSelect.vue'
import dayjs from 'dayjs'

const { can } = usePermissions()
// Las fechas solo se envían cuando están las dos
const filters = reactive({ user_id: '', event: '', start_date: '', end_date: '' })
const effective = reactive({ user_id: '', event: '', start_date: '', end_date: '' })
const crud = useCrud(auditService, 'audits', { extra: effective, column: 'created_at', dir: 'desc', perPage: 15 })
const dateWarning = ref('')

const columns = [
  { key: 'created_at', label: 'Fecha', sortable: true },
  { key: 'user', label: 'Usuario' },
  { key: 'event', label: 'Evento', sortable: true },
  { key: 'auditable_name', label: 'Modelo' },
  { key: 'ip_address', label: 'IP' },
]
const events = { created: 'Creado', updated: 'Actualizado', deleted: 'Eliminado', restored: 'Restaurado', attach: 'Asociado', detach: 'Desasociado', sync: 'Sincronizado' }

// Aplica los filtros validando el rango de fechas
const apply = () => {
  const { start_date, end_date } = filters
  dateWarning.value = ''
  if (!!start_date !== !!end_date) {
    dateWarning.value = 'Indica fecha desde y hasta (las dos).'
    return
  }
  if (start_date && end_date && dayjs(end_date).isBefore(start_date)) {
    dateWarning.value = 'La fecha hasta no puede ser menor que la fecha desde.'
    return
  }
  Object.assign(effective, filters)
  crud.refresh()
}
const clear = () => {
  Object.assign(filters, { user_id: '', event: '', start_date: '', end_date: '' })
  apply()
}
onMounted(crud.load)
</script>

<template>
  <CCard>
    <CCardHeader><strong>Auditoría</strong></CCardHeader>
    <CCardBody>
      <CRow class="mb-3 align-items-end">
        <CCol md="3">
          <label class="form-label">Usuario</label>
          <RemoteSelect v-model="filters.user_id" :service="userService" list-key="users" :label-fn="(u) => u.username" :params="{ with_trashed: 1 }" />
        </CCol>
        <CCol md="2">
          <label class="form-label">Evento</label>
          <CFormSelect v-model="filters.event">
            <option value="">Todos</option>
            <option v-for="(label, key) in events" :key="key" :value="key">{{ label }}</option>
          </CFormSelect>
        </CCol>
        <CCol md="2"><label class="form-label">Desde</label><CFormInput v-model="filters.start_date" type="date" /></CCol>
        <CCol md="2"><label class="form-label">Hasta</label><CFormInput v-model="filters.end_date" type="date" /></CCol>
        <CCol md="3" class="d-flex gap-2">
          <CButton color="primary" @click="apply">Filtrar</CButton>
          <CButton color="secondary" variant="outline" @click="clear">Limpiar</CButton>
        </CCol>
      </CRow>
      <CAlert v-if="dateWarning" color="warning" class="py-2">{{ dateWarning }}</CAlert>

      <DataTable
        :columns="columns"
        :rows="crud.items.value"
        :loading="crud.loading.value"
        :pagination="crud.pagination.value"
        :searchable="false"
        :sort-column="crud.query.column"
        :sort-dir="crud.query.dir"
        @page="crud.setPage"
        @sort="crud.sortBy"
      >
        <template #cell-user="{ row }">{{ row.user?.username ?? '-' }}</template>
        <template #cell-event="{ row }">{{ events[row.event] ?? row.event }}</template>
        <template #cell-auditable_name="{ row }">{{ row.auditable_name ?? row.auditable_type }}</template>
        <template #actions="{ row }">
          <RouterLink v-if="can('audits.find')" :to="`/audits/${row.id}`">
            <CButton color="info" variant="outline" size="sm" title="Ver"><CIcon :icon="cilSearch" /></CButton>
          </RouterLink>
        </template>
      </DataTable>
    </CCardBody>
  </CCard>
</template>
