<script setup>
import { cilSave } from '@coreui/icons'
import { computed, onMounted, reactive, ref } from 'vue'
import RequestTypeService from '@/services/RequestTypeService'
import RequisitionService from '@/services/RequisitionService'
import { useServerErrors } from '@/composables/useServerErrors'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import { confirmAction } from '@/utils/swal'
import Button from '@/components/UI/templates/Button.vue'
import ComboSelect from '@/components/UI/templates/ComboSelect.vue'
import ErrorSummary from '@/components/UI/templates/ErrorSummary.vue'
import FormField from '@/components/UI/templates/FormField.vue'
import LoadingForm from '@/components/UI/templates/Skeleton.vue'
import RequiredNote from '@/components/UI/templates/RequiredNote.vue'
import DynamicField from './DynamicField.vue'

// Crear (eligiendo el tipo) o editar una solicitud. Los campos salen del tipo de solicitud: cada tipo arma su propio formulario.
const props = defineProps({ id: [String, Number] })
const emit = defineEmits(['saved', 'cancel'])
const { errors, message, attributes, get, clear, handle } = useServerErrors()

const loading = ref(true)
const loadingType = ref(false)
const saving = ref(false)
const types = ref([])
const fields = ref([])
const typeName = ref('')
const form = reactive({ request_type_id: '', observation: '', data: {} })
// Archivos ya subidos por campo (al editar) y rutas que se quitan
const existing = reactive({})
const removeFiles = reactive({})
const saved = ref({}) // respuestas guardadas (al editar): nombres de lo elegido en los select dinámicos
// Cambios sin guardar: los archivos (File) no se serializan, por eso se cuentan sus nombres
const { mark, confirmLeave } = useUnsavedChanges(() => JSON.stringify({ form, removeFiles, files: Object.values(form.data).flat().filter((v) => v instanceof File).map((f) => f.name) }))
// Error de un campo o, si es una lista, el primero de sus elementos (data.x.1, data.x.2...)
const fieldError = (key) => get(`data.${key}`) || Object.entries(errors.value ?? {}).find(([k]) => k.startsWith(`data.${key}.`))?.[1]?.[0]

// Campos agrupados por sección, en el orden en que los definió el tipo
const sections = computed(() => {
  const groups = []
  fields.value.forEach((f) => {
    const name = f.section || 'Información de la solicitud'
    let group = groups.find((g) => g.name === name)
    if (!group) groups.push((group = { name, fields: [] }))
    group.fields.push(f)
  })
  return groups
})

// Valor guardado → valor del formulario (los select dinámicos se guardan con id y nombre)
const toInput = (field, value) => {
  const multiple = field.cardinality === 'multiple'
  if (field.type === 'selectdinamic') return multiple ? (value ?? []).map((v) => v.id) : value?.id ?? null
  if (field.type === 'file') return [] // los archivos nuevos; los ya subidos van en existing
  if (field.type === 'boolean') return !!value
  return value ?? (multiple ? [] : null)
}
const toggleRemove = (key, path) => {
  const list = removeFiles[key] ?? (removeFiles[key] = [])
  const i = list.indexOf(path)
  i >= 0 ? list.splice(i, 1) : list.push(path)
}
const hasFiles = computed(() => fields.value.some((f) => f.type === 'file'))

onMounted(async () => {
  try {
    if (props.id) {
      const requisition = (await RequisitionService.find(props.id)).data.requisition
      fields.value = requisition.fields ?? []
      typeName.value = requisition.request_type?.name ?? ''
      form.request_type_id = requisition.request_type_id
      form.observation = requisition.observation ?? ''
      saved.value = requisition.data ?? {}
      form.data = Object.fromEntries(fields.value.map((f) => [f.field, toInput(f, requisition.data?.[f.field])]))
      fields.value.filter((f) => f.type === 'file').forEach((f) => (existing[f.field] = requisition.data?.[f.field] ?? []))
    } else {
      types.value = (await RequestTypeService.all({ with_trashed: 0 })).data.request_types
    }
    mark()
  } catch (error) {
    handle(error)
  } finally {
    loading.value = false
  }
})

const chooseType = async (id) => {
  fields.value = []
  form.data = {}
  if (!id) return
  loadingType.value = true
  try {
    const type = (await RequestTypeService.find(id)).data.request_type
    fields.value = type.settings?.form ?? []
    form.data = Object.fromEntries(fields.value.map((f) => [f.field, toInput(f, null)]))
  } catch (error) {
    handle(error)
  } finally {
    loadingType.value = false
  }
}

const save = async () => {
  const ok = await confirmAction({
    title: props.id ? '¿Desea actualizar la solicitud?' : '¿Desea enviar la solicitud?',
    text: props.id ? 'Se actualizarán los datos.' : 'Quedará Pendiente hasta que la gestionen.',
    confirmText: props.id ? 'Sí, actualizar' : 'Sí, enviar',
  })
  if (!ok) return
  saving.value = true
  clear()
  try {
    const body = { observation: form.observation || null, data: form.data }
    let res
    if (hasFiles.value) {
      // Con archivos se envía multipart (la edición simula PUT con _method)
      // En multipart los sí/no van como 1/0 (Laravel no acepta el texto «false»)
      const data = Object.fromEntries(Object.entries(form.data).map(([k, v]) => [k, typeof v === 'boolean' ? (v ? 1 : 0) : v]))
      const multipart = { ...body, data, remove_files: removeFiles }
      res = props.id ? await RequisitionService.updateForm(props.id, multipart) : await RequisitionService.storeForm({ ...multipart, request_type_id: form.request_type_id })
    } else {
      res = props.id ? await RequisitionService.update(props.id, body) : await RequisitionService.store({ ...body, request_type_id: form.request_type_id })
    }
    mark()
    emit('saved', res.data?.requisition?.id ?? props.id)
  } catch (error) {
    handle(error)
  } finally {
    saving.value = false
  }
}

const cancel = async () => {
  if (await confirmLeave()) emit('cancel')
}
</script>

<template>
  <LoadingForm v-if="loading" variant="form" />
  <form v-else novalidate @submit.prevent="save">
    <ErrorSummary :message="message" :errors="errors" :attributes="attributes" />

    <CCard class="mb-4">
      <CCardHeader><strong>{{ id ? `Editar solicitud N° ${id}` : 'Nueva solicitud' }}</strong></CCardHeader>
      <CCardBody>
        <CRow>
          <CCol md="6">
            <FormField label="Tipo de solicitud" required :error="get('request_type_id')">
              <CFormInput v-if="id" :model-value="typeName" disabled />
              <ComboSelect
                v-else
                v-model="form.request_type_id"
                :options="types.map((t) => ({ value: t.id, label: t.name }))"
                placeholder="Elige el tipo de solicitud..."
                :invalid="!!get('request_type_id')"
                @change="chooseType(form.request_type_id)"
              />
            </FormField>
          </CCol>
          <CCol md="6">
            <FormField label="Observación" :error="get('observation')">
              <CFormInput v-model="form.observation" maxlength="1000" />
            </FormField>
          </CCol>
        </CRow>
        <p class="small text-body-secondary mb-0">La fecha, quién la crea (tú) y el estado (Pendiente) los registra el sistema.</p>
      </CCardBody>
    </CCard>

    <LoadingForm v-if="loadingType" variant="form" />
    <CCard v-for="s in sections" v-else :key="s.name" class="mb-4">
      <CCardHeader><strong>{{ s.name }}</strong></CCardHeader>
      <CCardBody>
        <CRow>
          <CCol v-for="f in s.fields" :key="f.field" :md="['textarea', 'file'].includes(f.type) || f.cardinality === 'multiple' ? 12 : 6">
            <DynamicField v-model="form.data[f.field]" :field="f" :error="fieldError(f.field)" :saved="saved[f.field]" :existing="existing[f.field] ?? []" :removed="removeFiles[f.field] ?? []" @toggle-remove="(path) => toggleRemove(f.field, path)" @auto="mark()" />
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>

    <template v-if="fields.length">
      <RequiredNote />
      <div class="d-flex gap-2 justify-content-end">
        <CButton color="secondary" variant="outline" @click="cancel">Cancelar</CButton>
        <Button type="submit" :loading="saving" :icon="cilSave">{{ id ? 'Actualizar' : 'Enviar solicitud' }}</Button>
      </div>
    </template>
    <div v-else-if="!id" class="d-flex justify-content-end">
      <CButton color="secondary" variant="outline" @click="cancel">Cancelar</CButton>
    </div>
  </form>
</template>
