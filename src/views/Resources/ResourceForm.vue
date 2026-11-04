<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useOptions } from '@/composables/useOptions'
import { useServerErrors } from '@/composables/useServerErrors'
import { notify } from '@/utils/swal'
import { firstOf } from '@/utils/format'
import { getPath, setPath } from '@/utils/paths'
import FieldInput from '@/components/FieldInput.vue'
import LoadingForm from '@/components/LoadingForm.vue'
import ErrorSummary from '@/components/ErrorSummary.vue'
import RequiredNote from '@/components/RequiredNote.vue'
import { useResource } from './resourceConfig'

// Formulario genérico de crear (sin id) y editar (con id)
const props = defineProps({ resource: { type: String, required: true }, id: [String, Number] })
const router = useRouter()
const { config, base, fixed } = useResource(props.resource)
const { options, loadOptions } = useOptions()
const { errors, message, get, clear, handle } = useServerErrors()

const loading = ref(true)
const saving = ref(false)
const entity = ref(null)
const form = reactive({})
const isEdit = !!props.id

// Valores iniciales: vacíos al crear, o los del registro al editar
const fill = (e) => {
  config.fields.forEach((f) => {
    if (f.type === 'location') {
      form[f.typeKey] = e?.[f.typeKey] ?? ''
      form[f.idKey] = e?.[f.idKey] ?? ''
    } else if (f.type === 'file') {
      setPath(form, f.key, null)
    } else if (f.type === 'password') {
      setPath(form, f.key, '')
    } else {
      const v = e ? getPath(e, f.from ?? f.key) : ''
      setPath(form, f.key, f.type === 'date' && v ? String(v).slice(0, 10) : v ?? '')
    }
  })
}

onMounted(async () => {
  fill(null)
  await loadOptions(config.optionKeys ?? [])
  if (isEdit) {
    try {
      entity.value = firstOf(await config.service.find(props.id))
      fill(entity.value)
    } catch (error) {
      handle(error)
    }
  }
  loading.value = false
})

const buildPayload = () => {
  const payload = { ...fixed.value }
  config.fields.forEach((f) => {
    if (f.type === 'location') {
      payload[f.typeKey] = form[f.typeKey]
      payload[f.idKey] = form[f.idKey]
      return
    }
    const v = getPath(form, f.key)
    if (f.type === 'file' && !(v instanceof File)) return // sin archivo nuevo no se envía
    if (f.type === 'password' && !v) return // contraseña vacía al editar = no cambia
    if (f.onlyWith && !(getPath(form, f.onlyWith) instanceof File)) return
    setPath(payload, f.key, v)
  })
  return payload
}

const save = async () => {
  saving.value = true
  clear()
  const payload = buildPayload()
  const hasFile = Object.values(payload).some((v) => v instanceof File)
  const s = config.service
  try {
    if (isEdit) await (hasFile ? s.updateForm(props.id, payload) : s.update(props.id, payload))
    else await (hasFile ? s.storeForm(payload) : s.store(payload))
    notify('Guardado correctamente')
    router.push(base.value)
  } catch (error) {
    handle(error)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <LoadingForm v-if="loading" />
  <form v-else @submit.prevent="save">
    <ErrorSummary :message="message" :errors="errors" />
    <CCard class="mb-4">
      <CCardHeader><strong>{{ isEdit ? 'Editar' : 'Nuevo' }} {{ config.singular }}</strong></CCardHeader>
      <CCardBody>
        <CRow>
          <CCol v-for="f in config.fields" :key="f.key" :md="['textarea', 'location'].includes(f.type) ? 12 : 6">
            <FieldInput :field="f" :form="form" :entity="entity" :options="options" :get="get" :is-edit="isEdit" />
          </CCol>
        </CRow>
        <RequiredNote />
      </CCardBody>
    </CCard>
    <div class="d-flex justify-content-end gap-2">
      <RouterLink :to="base"><CButton color="secondary" variant="outline">Cancelar</CButton></RouterLink>
      <CButton type="submit" color="primary" :disabled="saving"><CSpinner v-if="saving" size="sm" /> Guardar</CButton>
    </div>
  </form>
</template>
