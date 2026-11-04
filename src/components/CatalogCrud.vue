<script setup>
import { onMounted, reactive, ref } from 'vue'
import { cilPencil, cilPlus, cilReload, cilTrash } from '@coreui/icons'
import { useCrud } from '@/composables/useCrud'
import { usePermissions } from '@/composables/usePermissions'
import { useServerErrors } from '@/composables/useServerErrors'
import { confirmAction, notify } from '@/utils/swal'
import { errorMessage } from '@/utils/format'
import { getPath, setPath } from '@/utils/paths'
import Swal from 'sweetalert2'
import DataTable from './DataTable.vue'
import FormField from './FormField.vue'
import RequiredNote from './RequiredNote.vue'
import { useOptions } from '@/composables/useOptions'

// CRUD genérico guiado por configuración (ver catalogs.config.js)
const props = defineProps({ config: { type: Object, required: true } })
const { can } = usePermissions()
const perm = (action) => `${props.config.permission}.${action}`

const filters = reactive({ with_trashed: false })
const crud = useCrud(props.config.service, props.config.listKey, { extra: filters })
const { errors, get, clear, handle } = useServerErrors()
const { options, loadOptions } = useOptions()

const modal = ref(false)
const editingId = ref(null)
const saving = ref(false)
const form = reactive({})

// Valores iniciales del formulario a partir de los campos configurados
const fillForm = (row) => {
  Object.keys(form).forEach((k) => delete form[k])
  props.config.fields.forEach((f) => setPath(form, f.key, row ? getPath(row, f.from ?? f.key) ?? '' : ''))
}

const openCreate = () => {
  clear()
  editingId.value = null
  fillForm(null)
  modal.value = true
}
const openEdit = (row) => {
  clear()
  editingId.value = row.id
  fillForm(row)
  modal.value = true
}

// Pone en mayúsculas los campos marcados con `upper`
const onInput = (field, value) => setPath(form, field.key, field.upper ? String(value).toUpperCase() : value)

const save = async () => {
  saving.value = true
  try {
    const service = props.config.service
    if (editingId.value) await service.update(editingId.value, form)
    else await service.store(form)
    modal.value = false
    notify('Guardado correctamente')
    crud.load()
  } catch (error) {
    handle(error)
  } finally {
    saving.value = false
  }
}

const remove = async (row) => {
  if (!(await confirmAction({ title: `¿Eliminar ${props.config.singular}?`, text: row.name, confirmText: 'Sí, eliminar', icon: 'warning' }))) return
  try {
    await props.config.service.delete(row.id)
    notify('Eliminado correctamente')
    crud.load()
  } catch (error) {
    Swal.fire({ icon: 'error', title: 'No se pudo eliminar', text: errorMessage(error) })
  }
}

const restore = async (row) => {
  if (!(await confirmAction({ title: `¿Restaurar ${props.config.singular}?`, text: row.name }))) return
  try {
    await props.config.service.restore(row.id)
    notify('Restaurado correctamente')
    crud.load()
  } catch (error) {
    Swal.fire({ icon: 'error', title: 'No se pudo restaurar', text: errorMessage(error) })
  }
}

onMounted(() => {
  // Listas para los campos tipo select (ej. área del cargo)
  const keys = props.config.fields.filter((f) => f.optionsKey).map((f) => f.optionsKey)
  if (keys.length) loadOptions(keys)
  crud.load()
})
</script>

<template>
  <CCard>
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <strong>{{ config.title }}</strong>
      <CButton v-if="can(perm('store'))" color="primary" size="sm" @click="openCreate">
        <CIcon :icon="cilPlus" /> Nuevo
      </CButton>
    </CCardHeader>
    <CCardBody>
      <DataTable
        :columns="config.columns"
        :rows="crud.items.value"
        :loading="crud.loading.value"
        :pagination="crud.pagination.value"
        :search="crud.query.search"
        :sort-column="crud.query.column"
        :sort-dir="crud.query.dir"
        @update:search="crud.setSearch"
        @page="crud.setPage"
        @sort="crud.sortBy"
      >
        <template #filters>
          <CFormSwitch v-model="filters.with_trashed" label="Ver inactivos" @change="crud.refresh" />
        </template>

        <!-- Celdas por columna; el nombre muestra el estado inactivo -->
        <template v-for="col in config.columns" :key="col.key" #[`cell-${col.key}`]="{ row }">
          <template v-if="col.key === 'name'">
            {{ row.name }} <CBadge v-if="row.deleted_at" color="secondary">Inactivo</CBadge>
          </template>
          <template v-else>{{ getPath(row, col.key) ?? '-' }}</template>
        </template>

        <template #actions="{ row }">
          <template v-if="row.deleted_at">
            <CButton v-if="can(perm('restore'))" color="success" variant="outline" size="sm" title="Restaurar" @click="restore(row)">
              <CIcon :icon="cilReload" /> Restaurar
            </CButton>
          </template>
          <template v-else>
            <RouterLink v-for="a in config.extraActions" :key="a.label" :to="a.to(row)">
              <CButton v-if="can(a.permission)" color="info" variant="outline" size="sm" class="me-1" :title="a.label">{{ a.label }}</CButton>
            </RouterLink>
            <CButton v-if="can(perm('update'))" color="primary" variant="outline" size="sm" class="me-1" title="Editar" @click="openEdit(row)">
              <CIcon :icon="cilPencil" />
            </CButton>
            <CButton v-if="can(perm('delete'))" color="danger" variant="outline" size="sm" title="Eliminar" @click="remove(row)">
              <CIcon :icon="cilTrash" />
            </CButton>
          </template>
        </template>
      </DataTable>
    </CCardBody>
  </CCard>

  <CModal :visible="modal" alignment="center" @close="modal = false">
    <CModalHeader><CModalTitle>{{ editingId ? 'Editar' : 'Nueva' }} {{ config.singular }}</CModalTitle></CModalHeader>
    <form @submit.prevent="save">
      <CModalBody>
        <FormField v-for="f in config.fields" :key="f.key" :label="f.label" :required="f.required" :hint="f.hint" :error="get(f.key)">
          <CFormSelect
            v-if="f.type === 'select'"
            :model-value="getPath(form, f.key)"
            :invalid="!!errors[f.key]"
            @update:model-value="onInput(f, $event)"
          >
            <option value="">Selecciona...</option>
            <option v-for="o in options[f.optionsKey]" :key="o.id" :value="o.id">{{ o.name }}</option>
          </CFormSelect>
          <CFormTextarea
            v-else-if="f.type === 'textarea'"
            :model-value="getPath(form, f.key)"
            rows="3"
            :invalid="!!errors[f.key]"
            @update:model-value="onInput(f, $event)"
          />
          <CFormInput
            v-else
            :model-value="getPath(form, f.key)"
            :maxlength="f.maxlength"
            :invalid="!!errors[f.key]"
            @update:model-value="onInput(f, $event)"
          />
        </FormField>
        <RequiredNote />
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="outline" @click="modal = false">Cancelar</CButton>
        <CButton type="submit" color="primary" :disabled="saving"><CSpinner v-if="saving" size="sm" /> Guardar</CButton>
      </CModalFooter>
    </form>
  </CModal>
</template>
